const md5 = require('md5')
const userDao = require('../daos/user');
const spotifyDao = require('../daos/spotify');
const suspendedJobDao = require('../daos/suspended-job');
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require('../messages');
const normalizeSuspendJobData = require('../utils/normalize-suspend-job-data');
const encrypter = require('../utils/encrypter');

const DB_DATA = {
  attribute: 'spotify',
  tokens: {},
};

module.exports = async function (args) {
  try {
    const userId = md5(String(args.chatId));

    const { resource } = await userDao.getUser(userId);

    if (!resource) {
      await args.bot.sendMessage(args.chatId, staticBotMsgs.RESTART_CHAT);

      throw new Error(logMsgs.getInvalidUserId(userId));
    }
    const spotify = resource.data?.tokens?.spotify;

    if (!spotify || !spotify.refresh) {
      const jobData = normalizeSuspendJobData(args);

      const job = await suspendedJobDao.findOrCreateJob(userId, jobData);

      if (!job.isNew) {
        await suspendedJobDao.updateJob(userId, jobData);
      }

      await args.bot.sendMessage(args.chatId, dynamicBotMsgs.getSpotifyAuth(userId));

      throw new Error(logMsgs.NO_REFRESH_TOKEN);
    }

    //const { id, access, refresh } = spotify;

    const refData = JSON.parse(spotify.refresh);
    const refreshToken = encrypter.decrypt(refData.encryptedData, refData.iv);

    let accessToken;
    const accessData = JSON.parse(spotify.access || '{}');
    const expTime = accessData.expTimeMillis || 0;

    if (Date.now() > expTime) {
      accessToken = await spotifyDao.getAccessToken(refreshToken);

      if (!accessToken) {
        await args.bot.sendMessage(args.chatId, staticBotMsgs.INTERNAL_ERROR);

        throw new Error(logMsgs.NO_ACCESS_TOKEN);
      }

      const encryptedData = encrypter.encrypt(accessToken);
      encryptedData.expTimeMillis = Date.now() + 50 * 60 * 1000;

      DB_DATA.tokens.access = JSON.stringify(encryptedData);
    } else {
      accessToken = encrypter.decrypt(accessData.encryptedData, accessData.iv);
    }

    let profileId = spotify.id;

    if (!profileId) {
      const profile = await spotifyDao.getUserProfile(accessToken);

      if (!profile?.id) {
        await args.bot.sendMessage(args.chatId, staticBotMsgs.INTERNAL_ERROR);

        throw new Error(logMsgs.NO_PROFILE_ID_TOKEN);
      }
      profileId = profile.id;

      DB_DATA.tokens.id = profileId;
    }

    if (Object.keys(DB_DATA.tokens).length) {
      await userDao.updateTokens(userId, DB_DATA);
    }

    args.body.user = args.body.user || { name: resource.data.name };

    args.body.user.spotifyTokens = { accessToken, id: profileId };
  } catch (err) {
    throw err;
  }

 
};
