const aiDao = require('../../daos/open-AI');
const chatDao = require('../../daos/chat-history');
const resUtil = require('../../utils/res-util');
const { staticBotMsgs, logMsgs } = require('../../messages');
const { IMG_SIZE } = require('../../utils/constants');
const TimeLogger = require('../../utils/timelogger');

module.exports = async function ({ prompt, chatId, bot }) {
  const timeLogger = new TimeLogger(`GENERATE-IMAGE-DURATION-${Date.now()}`);
  try {
    const chatLog = [{ role: 'user', content: prompt }];

    timeLogger.start('getting-AI-data');

    const images = await aiDao.generateImages({ prompt, n: 2, size: IMG_SIZE });

    timeLogger.end('getting-AI-data');

    const media = images.map((image) => ({
      type: 'photo',
      media: image.url,
    }));

    await bot.sendMediaGroup(chatId, media);

    chatLog.push({ role: 'assistant', content: 'Created images' });

    timeLogger.start('updating-chat-history');

    await chatDao.updateHistory(chatId, chatLog);

    timeLogger.end('updating-chat-history');

    return resUtil.success({ message: logMsgs.IMG_GENERATED, data: images });
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.INTERNAL_ERROR);

    err.message = `GEN-IMAGE-REQ-HANDLER: ${err.message}`;
    throw err;
  } finally {
    timeLogger.log();
  } };
