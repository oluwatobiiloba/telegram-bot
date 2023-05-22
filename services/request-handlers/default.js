const chatDao = require('../../daos/chat-history');
const aiDao = require('../../daos/open-AI');
const { logMsgs, staticBotMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');
const TimeLogger = require('../../utils/timelogger');

module.exports = async function ({ prompt, chatId, bot }) {
  const timeLogger = new TimeLogger(`DEFAULT-HANDLER-DURATION-${Date.now()}`);
  try {
    timeLogger.start('getting-chat-history')

    let chatHistory = await chatDao.getHistory(chatId);

    timeLogger.end('getting-chat-history')

    chatHistory.push({ role: 'user', content: prompt });

    if (chatHistory.length > 7) chatHistory.shift();

    const promptMessages = chatHistory.filter(({ content }) => content && content.length < 1000);

    timeLogger.start('getting-AI-response')

    const choices = await aiDao.prompt(promptMessages);

    timeLogger.end('getting-AI-response')

    const aiReply = choices[0].message.content;

    await bot.sendMessage(chatId, aiReply);

    chatHistory.push({ role: 'assistant', content: aiReply });

    timeLogger.start('updating-chat-history')

    await chatDao.overwriteHistory(chatId, chatHistory);

    timeLogger.end('updating-chat-history')

    return resUtil.success(logMsgs.PROMPT_REPLY_SENT);
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    err.message = `DEFAULT-REQ-HANDLER: ${err.message}`;
    throw err;
  } finally {
    timeLogger.log();
  }
};
