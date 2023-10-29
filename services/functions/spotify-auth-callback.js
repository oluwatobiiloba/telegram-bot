const { encrypt } = require('../../utils/encrypter');
const azureQueue = require('../../queue-workers/azure-queue-worker/queue');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');
const resUtil = require('../../utils/res-util');
const { logMsgs, staticBotMsgs } = require('../../messages');
const spotifyDao = require('../../daos/spotify');
const userDao = require('../../daos/user');
const suspendedJobDao = require('../../daos/suspended-job');
const createTelegramBot = require('../../utils/createTelegramBot');

module.exports = async function (req) {
  const code = req.query.get('code');
  const userId = req.query.get('state');
  const error = req.query.get('error');

  let timeLogger, bot, chatId;

  try {
    const { resource: suspendJobData } = await suspendedJobDao.getJob(userId);

    if (!suspendJobData?.data) {
      throw new Error(logMsgs.MISSING_JOB_DATA);
    }

    const isManual = suspendJobData?.data.isManual;

    bot = createTelegramBot(suspendJobData.data.botToken);
    chatId = suspendJobData.data?.chatId;

    if (error) throw new Error(`Authorization error: ${error}`);

    timeLogger = new TimeLogger(`SPOTIFY-CALLBACK-DURATION-${userId || Date.now()}`);

    const user = await userDao.getUser(userId);

    if (user?.resource?.id !== userId) throw new Error(logMsgs.getInvalidUserId(id));

    await bot.sendMessage(chatId, staticBotMsgs.CALLBACK_AUTH_MSGS[0]);

    timeLogger.start('retrieve-tokens');

    const tokens = await spotifyDao.getTokens(code);

    timeLogger.end('retrieve-tokens');

    if (!tokens?.refreshToken || !tokens?.accessToken) throw new Error(logMsgs.NO_SPOTIFY_TOKENS);

    const spotifyProfile = await spotifyDao.getUserProfile(tokens.accessToken);

    let accessToken = encrypt(tokens.accessToken);
    accessToken.expTimeMillis = Date.now() + 50 * 60 * 1000;

    accessToken = JSON.stringify(accessToken);
    const refreshToken = JSON.stringify(encrypt(tokens.refreshToken));

    await bot.sendMessage(chatId, staticBotMsgs.CALLBACK_AUTH_MSGS[1]);

    timeLogger.start('store-tokens');

    const dbData = {
      attribute: 'spotify',
      tokens: {
        id: spotifyProfile?.id,
        access: accessToken,
        refresh: refreshToken,
      },
    };

    await userDao.addTokens(userId, dbData);

    timeLogger.end('store-tokens');

    await bot.sendMessage(chatId, staticBotMsgs.CALLBACK_AUTH_MSGS[2]);

    if (!isManual) {
      await azureQueue.sendMessage('process-suspended-job', {
        botToken: bot.token,
        id: userId,
      });
    } else {
      suspendedJobDao.deleteJob(userId);
    }

    return resUtil.success('Authorization successful!');
  } catch (err) {
    if (bot) await bot.sendMessage(chatId, staticBotMsgs.ERROR_GEN_PLAYLIST);

    logger.error(err, `SPOTIFY-CALLBACK-ERROR-${userId || Date.now()}`);

    return resUtil.error(200, err);
  } finally {
    if (timeLogger) timeLogger.log();
  }
};
