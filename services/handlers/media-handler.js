const resUtil = require('../../utils/res-util');
const md5 = require('md5');
const fileDao = require('../../daos/file-container');
const { logMsgs, staticBotMsgs, dynamicBotMsgs } = require('../../messages');

module.exports = async function (context, body, bot) {
  const chatId = body?.message?.chat?.id;
  let response;
  try {
    if (body.my_chat_member) {
      const groupId = body?.my_chat_member?.chat?.id;

      await bot.sendMessage(groupId, '🤖');

      context.log(logMsgs.REMOVED_FROM_GROUP);

      response = resUtil.success(logMsgs.REMOVED_FROM_GROUP);
    }

    if (body.message?.video_note) {
      await bot.sendMessage(chatId, staticBotMsgs.CANT_PROCESS_VIDEO_NOTES);

      context.log(logMsgs.CANT_PROCESS_VIDEO_NOTES);

      response = resUtil.success(logMsgs.CANT_PROCESS_VIDEO_NOTES);
    }

    const document = body.message?.document;
    if (document) {
      if (document.mime_type !== 'application/pdf') {
        bot.sendMessage(chatId, staticBotMsgs.CAN_ONLY_PROCESS_PDF);

        context.log(logMsgs.INVALID_FILE_FORMAT);

        response = resUtil.success(logMsgs.INVALID_FILE_FORMAT);
      }

      document.file_id = md5(String(document.file_id)).toLowerCase();
      document.chatId = chatId;

      await fileDao.uploadDocument(document);

      await bot.sendMessage(chatId, dynamicBotMsgs.getDocReceived(document.file_id));

      context.log(logMsgs.getFileUploadSuccess(document.file_id));

      response = resUtil.success(logMsgs.getFileUploadSuccess(document.file_id));
    }

    return response;
  } catch (err) {
    throw err;
  }
};
