const aiDao = require('../../daos/open-AI');
const chatDao = require('../../daos/chat-history');
const resUtil = require('../../utils/res-util');
const { staticBotMsgs, logMsgs } = require('../../messages');
const { IMG_SIZE } = require('../../utils/constants');

module.exports = async function ({ prompt, chatId, bot }) {
  try {
    const chatLog = [{ role: 'user', content: prompt }];

    const images = await aiDao.generateImages({ prompt, n: 2, size: IMG_SIZE });
    
    const media = images.map((image) => ({
      type: 'photo',
      media: image.url,
    }));

    await bot.sendMediaGroup(chatId, media);

    chatLog.push({ role: 'assistant', content: 'Created images' });

    await chatDao.updateHistory(chatId, chatLog);

    return resUtil.success({ message: logMsgs.IMG_GENERATED, data: images });
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    err.message = `GEN-IMAGE-REQ-HANDLER: ${err.message}`;
    throw err;
  }
};
