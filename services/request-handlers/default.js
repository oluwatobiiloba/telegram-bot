const chatDao = require('../../daos/chat-history');
const { ACTIVE_AI_PROVIDER } = process.env;
const provideMap = new Map([
  ['cloudfare', 'cloudfare-ai-worker'],
  ['openai', 'open-AI'],
])
const aiDao = require(`../../daos/${provideMap.get(ACTIVE_AI_PROVIDER || 'cloudfare')}`);
const { logMsgs, staticBotMsgs } = require('../../messages');
const logger = require('../../utils/logger');
const { generatePrompt } = require('../../utils/promptBuilder');
const resUtil = require('../../utils/res-util');
const TimeLogger = require('../../utils/timelogger');

module.exports = async function ({ prompt, chatId, bot }) {
  const timeLogger = new TimeLogger(`DEFAULT-HANDLER-DURATION-${Date.now()}`);
  try {
    timeLogger.start('getting-chat-history');

    let chatHistory = await chatDao.getHistory(chatId);

    timeLogger.end('getting-chat-history');

    chatHistory.push({ role: 'user', content: prompt });

    function ensureMaxChatLength(chatHistory, maxLength) {
    if (chatHistory.length > maxLength) {
      chatHistory = chatHistory.slice(chatHistory.length - maxElements);
    }
    return chatHistory;
  }

    chatHistory = ensureMaxChatLength(chatHistory, 7);

    const promptMessages = chatHistory.map(({ content }) => content && content.length < 1000);

    timeLogger.start('getting-AI-response');

    const aiPrompt = generatePrompt({
      userInput: promptMessages
    })

    const choices = await aiDao.prompt(aiPrompt);

    timeLogger.end('getting-AI-response');

    let aiReply;

    if(Array.isArray(choices)) {
      aiReply = choices[0]?.message?.content;
    } else {
      aiReply = choices.result?.response
    }

    await bot.sendMessage(chatId, aiReply);

    chatHistory.push({ role: 'assistant', content: aiReply });

    logger.info({ prompt: promptMessages, aiResponse: aiReply }, `DEFAULT-HANDLER-${Date.now()}`);

    timeLogger.start('updating-chat-history');

    await chatDao.overwriteHistory(chatId, chatHistory);

    timeLogger.end('updating-chat-history');

    return resUtil.success(logMsgs.PROMPT_REPLY_SENT);
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    err.message = `DEFAULT-REQ-HANDLER: ${err.message}`;
    throw err;
  } finally {
    timeLogger.log();
  }
};
