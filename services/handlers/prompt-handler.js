const mediaHandler = require('./media-handler');
const chatDao = require('../../daos/chat-history');
const { staticBotMsgs, logMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');
const promptMapper = require('../../utils/prompt-mapper');

module.exports = async function (context, body, bot) {
  try {
    const mediaResponse = await mediaHandler(context, body, bot);

    if (mediaResponse) {
      return mediaResponse;
    }

    if (!body.message) throw new Error('No message');

    const prompt = body.message.text?.toLowerCase();

    if (!prompt) {
      await bot.sendMessage(chatId, staticBotMsgs.NO_PROMPT);

      throw new Error('No Prompt in message');
    }

    const chatId = body.message.chat.id;

    switch (prompt) {
      case '/clear':
        context.log('Clearing chat history');

        await chatDao.deleteHistory(chatId);

        await bot.sendMessage(chatId, staticBotMsgs.CLEAR_HISTORY);

        return resUtil.success(staticBotMsgs.CLEAR_HISTORY);

      case '/start':
        context.log(logMsgs.getConvoStarted(chatId));

        await bot.sendMessage(chatId, staticBotMsgs.START_CHAT);

        return resUtil.success(logMsgs.getConvoStarted(chatId));

      case '/help':
        context.log(logMsgs.getHelpMessageSent(chatId));

        await bot.sendMessage(chatId, help_text.help);

        return resUtil.success(logMsgs.getHelpMessageSent(chatId));
    }

    const handler = promptMapper(prompt);

    const handlerFunc = require(`../request-handlers/${handler}`);

    return handlerFunc({ prompt, chatId, bot, body });
  } catch (err) {
    throw err;
  }
};
