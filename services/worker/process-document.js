const { DOC_REGEX } = require('../../utils/constants');
const fileContainerDAO = require('../../daos/file-container');
const aiDao = require('../../daos/open-AI');
const documentProcessor = require('../../utils/document-processor');
const { logMsgs, staticBotMsgs, dynamicBotMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');

async function service(context, body, bot) {
  const message = body.message?.text;
  const chatId = body.message?.chat?.id;

  try {
    let promptKey = message.match(DOC_REGEX) || [''];
    promptKey = promptKey[0].split(' ');

    const isResume = promptKey[0].includes('resume');
    const uniqueId = promptKey[1];

    if (!uniqueId) {
      await bot.sendMessage(chatId, staticBotMsgs.INVALID_JOB_ID);
      return resUtil.error(400, new Error(logMsgs.INVALID_JOB_ID));
    }
    const prompt = message.replace(DOC_REGEX, '').trim();

    const file = await fileContainerDAO.findDocument(uniqueId);

    const fileUrl = await bot.getFileLink(uniqueId);

    const { fileName, textInput } = await documentProcessor.retrieveDocument({
      fileUrl,
      body,
      file,
    });

    await bot.sendMessage(chatId, dynamicBotMsgs.getDocUpdate(isResume));

    const AIChoices = await aiDao.optimizeDocument(textInput, prompt, isResume);

    await bot.sendMessage(chatId, staticBotMsgs.ALMOST_DONE);

    const optimizedDoc = (AIChoices[0].message.content + '').replace(/""/g, '');

    const pdf = documentProcessor.createPDF(optimizedDoc);

    await bot.sendMessage(chatId, staticBotMsgs.ALMOST_DONE_2 + '\n\n' + 'Uploading ☁️☁️');


    const blobUrl = await documentProcessor.uploadToBlob(pdf, fileName);

    await bot.sendMessage(
      chatId,
      dynamicBotMsgs.getJobComplete(blobUrl) + '\n\n' + staticBotMsgs.DOC_PROC_FINAL_MSG
    );

    return resUtil.success(logMsgs.RESUME_PROCESSED);
  } catch (error) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    error.message = `${logMsgs.INTERNAL_ERROR} - ${error.message}`;

    context.log('Error occurred:', error);

    throw error;
  }
}

module.exports = service;
