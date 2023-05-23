const docQueue = require('../../queue-workers/queue');
const resUtil = require('../../utils/res-util');
const { logMsgs, dynamicBotMsgs } = require('../../messages');
const { DOC_REGEX, JOB_PROCESS_DOC } = require('../../utils/constants');
const promptHandler = require('../handlers/prompt-handler');
const logger = require('../../utils/logger');

async function service(request, bot) {
  const body = await request.json();
  const prompt = body.message?.text;

  try {
    let response;

    if (DOC_REGEX.test(prompt.substring(0, 50))) {
      const job = await docQueue.add(JOB_PROCESS_DOC, { body, bot });

      await bot.sendMessage(body.message.chat.id, dynamicBotMsgs.getJobInProgress(job.id));

      response = resUtil.success(logMsgs.JOB_QUEUED);

      logger.info(response, job.id);
    } else {
      response = await promptHandler(body, bot);
      logger.info(response, `CHAT-BOX-${Date.now()}`);
    }

    return response;
  } catch (error) {
    // console.log(error);

    logger.error(error, 'CHAT-BOX-ERROR');

    return resUtil.error(500, error);
  } finally {
    logger.flush();
  }
}

module.exports = service;
