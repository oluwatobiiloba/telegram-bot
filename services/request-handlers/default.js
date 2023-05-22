const chatDao = require('../../daos/chat-history');
const aiDao = require('../../daos/open-AI');
const { logMsgs } = require('../../messages');
const resUtil = require('../../utils/res-util');

module.exports = async function ({ prompt, chatId, bot }) {
  try {
    let chatHistory = await chatDao.getHistory(chatId);
    chatHistory.push({ role: 'user', content: prompt });

    if (chatHistory.length > 7) chatHistory.shift();

    const promptMessages = chatHistory.filter(({ context }) => context && context.length < 1000);

    const choices = await aiDao.prompt(promptMessages);

    const aiReply = choices[0].message.content;

    await bot.sendMessage(chatId, aiReply);

    chatHistory.push({ role: 'assistant', content: aiReply });

    await chatDao.overwriteHistory(chatId, chatHistory);

    return resUtil.success(logMsgs.PROMPT_REPLY_SENT);
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    err.message = `DEFAULT-REQ-HANDLER: ${err.message}`;
    throw err;
  }
};
