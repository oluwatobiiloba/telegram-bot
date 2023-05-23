const mediaHandler = require('./media-handler');
const chatDao = require('../../daos/chat-history');
const { staticBotMsgs, logMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');
const promptMapper = require('../../utils/prompt-mapper');
const TimeLogger = require('../../utils/timelogger');
const logger = require('../../utils/logger');

module.exports = async function (body, bot) {
  const timeLogger = new TimeLogger(`PROMPT-HANDLER-DURATION-${Date.now()}`);

  const LOG_KEY = `PROMPT-HANDLER-${Date.now()}`;

  try {
    timeLogger.start('media-handler');

    const mediaResponse = await mediaHandler(body, bot);

    timeLogger.end('media-handler');

    if (mediaResponse) {
      return mediaResponse;
    }

    if (!body.message) throw new Error('No message');

    const prompt = body.message.text;

    if (!prompt) {
      await bot.sendMessage(chatId, staticBotMsgs.NO_PROMPT);

      throw new Error('No Prompt in message');
    }

    const chatId = body.message.chat.id;

    logger.info({ chatId, prompt }, LOG_KEY);

    switch (prompt.toLowerCase()) {
      case '/clear':
        logger.info('Clearing chat history...', LOG_KEY);

        await chatDao.deleteHistory(chatId);

        await bot.sendMessage(chatId, staticBotMsgs.CLEAR_HISTORY);

        return resUtil.success(staticBotMsgs.CLEAR_HISTORY);

      case '/start':
        logger.info(logMsgs.getConvoStarted(chatId), LOG_KEY);

        await bot.sendMessage(chatId, staticBotMsgs.START_CHAT);

        return resUtil.success(logMsgs.getConvoStarted(chatId));

      case '/help':
        logger.info(logMsgs.getHelpMessageSent(chatId), LOG_KEY);

        await bot.sendMessage(chatId, help_text.help);

        return resUtil.success(logMsgs.getHelpMessageSent(chatId));
    }

    const handler = promptMapper(prompt);

    const handlerFunc = require(`../request-handlers/${handler}`);

    timeLogger.start(`running-${handler}-function`);

    const funcRes = await handlerFunc({ prompt, chatId, bot, body });

    timeLogger.end(`running-${handler}-function`);

    return funcRes;
  } catch (err) {
    throw err;
  } finally {
    timeLogger.log();
  }
};
