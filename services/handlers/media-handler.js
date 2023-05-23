const resUtil = require('../../utils/res-util');
const md5 = require('md5');
const fileDao = require('../../daos/file-container');
const { logMsgs, staticBotMsgs, dynamicBotMsgs } = require('../../messages');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');

module.exports = async function (body, bot) {
  const chatId = body?.message?.chat?.id;

  const LOG_KEY = `MEDIA-HANDLER-${Date.now()}`;

  const timeLogger = new TimeLogger(`MEDIA-HANDLER-DURATION-${Date.now()}`);

  let response;

  try {
    if (body.my_chat_member) {
      const groupId = body?.my_chat_member?.chat?.id;

      await bot.sendMessage(groupId, '🤖');

      logger.info(logMsgs.REMOVED_FROM_GROUP, LOG_KEY);

      response = resUtil.success(logMsgs.REMOVED_FROM_GROUP);
    }

    if (body.message?.video_note) {
      await bot.sendMessage(chatId, staticBotMsgs.CANT_PROCESS_VIDEO_NOTES);

      logger.info(logMsgs.CANT_PROCESS_VIDEO_NOTES, LOG_KEY);

      response = resUtil.success(logMsgs.CANT_PROCESS_VIDEO_NOTES);
    }

    const document = body.message?.document;
    if (document) {
      if (document.mime_type !== 'application/pdf') {
        bot.sendMessage(chatId, staticBotMsgs.CAN_ONLY_PROCESS_PDF);

        logger.info(logMsgs.INVALID_FILE_FORMAT, LOG_KEY);

        response = resUtil.success(logMsgs.INVALID_FILE_FORMAT);
      }

      timeLogger.start('uploading-document');

      document.file_id = md5(String(document.file_id)).toLowerCase();
      document.chatId = chatId;

      await fileDao.uploadDocument(document);
      timeLogger.end('uploading-document');

      await bot.sendMessage(chatId, dynamicBotMsgs.getDocReceived(document.file_id));

      logger.info(logMsgs.getFileUploadSuccess(document.file_id), LOG_KEY);

      response = resUtil.success(logMsgs.getFileUploadSuccess(document.file_id));
    }

    return response;
  } catch (err) {
    throw err;
  } finally {
    timeLogger.log();
  }
};
