const docQueue = require('../../queue-workers/azure-queue-worker/queue');
const resUtil = require('../../utils/res-util');
const { logMsgs, dynamicBotMsgs } = require('../../messages');
const { DOC_REGEX, JOB_PROCESS_DOC, YOUTUBE_REGEX } = require('../../utils/constants');
const promptHandler = require('../handlers/prompt-handler');
const logger = require('../../utils/logger');
async function service(request, bot) {
  try {
    const body = await request.json();
    const prompt = body.message?.text;
    const botToken = bot.token;

    let response;

    if (DOC_REGEX.test(prompt?.substring(0, 50))) {
      const jobId = await docQueue.sendMessage(JOB_PROCESS_DOC, { body, botToken });

      await bot.sendMessage(body.message.chat.id, dynamicBotMsgs.getJobInProgress(jobId));

      response = resUtil.success(logMsgs.JOB_QUEUED);

      logger.info(response, `JOB-QUEUED-${jobId}`);
    } else {
      response = await promptHandler(body, bot);
      logger.info(response, `CHAT-BOX-${Date.now()}`);
    }

    return response;
  } catch (error) {
    // console.log(error);

    logger.error(error, `CHAT-BOX-ERROR-${Date.now()}`);

    return resUtil.error(200, error);
  } finally {
    logger.flush();
  }
}

module.exports = service;
