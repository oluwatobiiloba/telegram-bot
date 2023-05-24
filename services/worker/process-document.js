const { DOC_REGEX } = require('../../utils/constants');
const fileContainerDAO = require('../../daos/file-container');
const aiDao = require('../../daos/open-AI');
const documentProcessor = require('../../utils/document-processor');
const { logMsgs, staticBotMsgs, dynamicBotMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');

async function service(body, bot) {
  const message = body.message?.text;
  const chatId = body.message?.chat?.id;

  if (!chatId) throw new Error(logMsgs.NO_CHAT_ID);

  const timeLogger = new TimeLogger(`PROCESS-DOC-DURATION-${Date.now()}`);

  try {
    let promptKey = message.substring(0, 50).match(DOC_REGEX) || [''];
    promptKey = promptKey[0].split(' ');

    const isResume = promptKey[0].includes('resume');
    const uniqueId = promptKey[1];

    if (!uniqueId) {
      await bot.sendMessage(chatId, staticBotMsgs.INVALID_JOB_ID);
      return resUtil.error(400, new Error(logMsgs.INVALID_JOB_ID));
    }
    const prompt = message.replace(DOC_REGEX, '').trim();

    timeLogger.start('get-file');

    const file = await fileContainerDAO.findDocument(uniqueId);

    const fileId = file?.document?.file_id?.trim();

    if (!fileId) {
      throw new Error(logMsgs.NO_DOCUMENT_FOUND);
    }

    const fileUrl = await bot.getFileLink(fileId);
    timeLogger.end('get-file');


    timeLogger.start('processing-document');
    const { fileName, textInput } = await documentProcessor.retrieveDocument({
      fileUrl,
      body,
      file,
    });
    timeLogger.end('processing-document');

    await bot.sendMessage(chatId, dynamicBotMsgs.getDocUpdate(isResume));

    timeLogger.start('optimizing-document');

    const AIChoices = await aiDao.optimizeDocument(textInput, prompt, isResume);

    timeLogger.end('optimizing-document');

    await bot.sendMessage(chatId, staticBotMsgs.ALMOST_DONE);

    const optimizedDoc = (AIChoices[0].message.content + '').replace(/""/g, '');

    timeLogger.start('creating-pdf');

    const pdf = documentProcessor.createPDF(optimizedDoc);

    timeLogger.end('creating-pdf');

    await bot.sendMessage(chatId, staticBotMsgs.ALMOST_DONE_2 + '\n\n' + 'Uploading ☁️☁️');

    timeLogger.start('uploading-pdf');

    const blobUrl = await documentProcessor.uploadToBlob(pdf, fileName);

    timeLogger.end('uploading-pdf');

    await bot.sendMessage(
      chatId,
      dynamicBotMsgs.getJobComplete(blobUrl) + '\n\n' + staticBotMsgs.DOC_PROC_FINAL_MSG
    );

    return resUtil.success(logMsgs.RESUME_PROCESSED);
  } catch (error) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    error.message = `PROCESS-DOC-WORKER-${logMsgs.INTERNAL_ERROR} -> ${error.message}`;

    throw error;
  } finally {
    timeLogger.log();
  }
}

module.exports = service;
