const docQueue = require('../../queue-workers/queue');
const resUtil = require('../../utils/res-util');
const { logMsgs, dynamicBotMsgs } = require('../../messages');
const { DOC_REGEX, JOB_PROCESS_DOC } = require('../../utils/constants');
const promptHandler = require('../handlers/prompt-handler');

async function service(request, context, bot) {
  const body = await request.json();
  const prompt = body.message?.text;

  try {
    let response;

    if (DOC_REGEX.test(prompt)) {
      const job = await docQueue.add(JOB_PROCESS_DOC, { body, context, bot });

      await bot.sendMessage(body.message.chat.id, dynamicBotMsgs.getJobInProgress(job.id));

      response = resUtil.success(logMsgs.JOB_QUEUED);
    }

    response = await promptHandler(context, body, bot);

    return response;
  } catch (error) {
    context.log(error);

    return resUtil.error(500, error);
  }
}

module.exports = service;
