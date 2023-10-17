const mediaHandler = require('./media-handler');
const chatDao = require('../../daos/chat-history');
const { staticBotMsgs, logMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');
const promptMapper = require('../../utils/prompt-mapper');
const TimeLogger = require('../../utils/timelogger');
const logger = require('../../utils/logger');
const middlewareHandler = require('./middleware-handler');
const userDao = require('../../daos/user');
const md5 = require('md5');

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
        // get user if none then create one
        const userId = md5(String(chatId));

        await userDao.findOrCreateUser(userId, {
          name: body.message?.from?.first_name || 'Mayan',
          chatId,
        });

        await chatDao.getHistory(chatId);

        await bot.sendMessage(chatId, staticBotMsgs.START_CHAT);

        return resUtil.success(logMsgs.getConvoStarted(chatId));

      case '/help':
        logger.info(logMsgs.getHelpMessageSent(chatId), LOG_KEY);

        await bot.sendMessage(chatId, staticBotMsgs.HELP);

        return resUtil.success(logMsgs.getHelpMessageSent(chatId));
    }
    const reqArgs = { prompt, chatId, bot, body };

    const handler = promptMapper(prompt);
    logger.info(`${handler} ${prompt}`,"trouble shooting")

    const handlerFunc = require(`../request-handlers/${handler}`);

    timeLogger.start(`running-${handler}-middlewares`);
    if (handlerFunc.middlewares?.length) {
      reqArgs.handler = handler;

      await middlewareHandler(handlerFunc.middlewares, reqArgs);
    }
    timeLogger.end(`running-${handler}-middlewares`);

    delete reqArgs.handler;

    timeLogger.start(`running-${handler}-function`);

    const funcRes = await handlerFunc(reqArgs);

    timeLogger.end(`running-${handler}-function`);

    return funcRes;
  } catch (err) {
    throw err;
  } finally {
    timeLogger.log();
  }
};
