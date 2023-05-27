const playlistConverter = require('../../daos/playlist-converter');
const musicDao = require('../../daos/spotify');
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require('../../messages');
const { APPLE_REGEX } = require('../../utils/constants');
const resUtil = require('../../utils/res-util');
const authDao = require('../../daos/auth')
const { decryptRefreshToken } = require('../../utils/encryption')
const TimeLogger = require('../../utils/timelogger');

module.exports = async function ({ prompt, chatId, bot, body }) {
 
  const appleUrl = prompt.match(APPLE_REGEX)[0];

  let REFRESH_TOKEN = null;
  const timeLogger = new TimeLogger(`CONVERT-APPLE-PLAYLIST-DURATION-${Date.now()}`);
  let funcResponse;

  try {
  
    const userAuth = await authDao.getAuth(chatId)

    timeLogger.start('getting-user-auth');

    if (!userAuth || !userAuth.spotify) {
      await bot.sendMessage(chatId, `You do not have a spotify account linked to your telegram account. Kindly use this link to link your account: http://localhost:7071/api/spotify?chat_id=${chatId}`);
      const suspendedJobData = { prompt, chatId, bot, body }
      await authDao.createAuth(chatId, null , suspendedJobData )
      return funcResponse = resUtil.success(logMsgs.NO_SPOTIFY_ACCOUNT_LINKED);
    } else {
      const {spotify: { hashedRefreshToken : { iv , encryptedToken}  }} = userAuth
      REFRESH_TOKEN = decryptRefreshToken(encryptedToken, iv)
    }


    timeLogger.start('getting-access-token');

    const accessToken = await musicDao.getAccessToken(REFRESH_TOKEN);

    timeLogger.end('getting-access-token');

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[1]);

    if (accessToken) {
      timeLogger.start('checking-user-access');

      const userProfile = await musicDao.getUserProfile(accessToken);

      const user = {
        id: userProfile.id,
        username: body.message?.from?.first_name,
      };
      timeLogger.end('checking-user-access');


    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[0]);

    timeLogger.start('getting-playlist-content');

    const { playlistContent, image, tracks } = await playlistConverter.appleToSpotify(appleUrl);

    timeLogger.end('getting-playlist-content');

    if (!tracks) throw new Error(logMsgs.NO_PLAYLIST_TRACK_INFO);

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[2]);

      const config = {
        name: playlistContent.name,
        description: playlistContent.description,
        author: playlistContent.author.name,
        isConverted: true,
        image,
        user,
      };
      timeLogger.start('creating-playlist');

      const playlistURL = await musicDao.createPlaylist(tracks, accessToken, config);

      timeLogger.end('creating-playlist');

      await bot.sendMessage(
        chatId,
        dynamicBotMsgs.getPlaylistGenerated(playlistURL) +
          '\n\n' +
          staticBotMsgs.GEN_PLAYLIST_SEQ[3]
      );

      funcResponse = resUtil.success({ message: logMsgs.PLAYLIST_GENERATED, data: playlistURL });
    } else {
      await bot.sendMessage(chatId, staticBotMsgs.ERROR_GEN_PLAYLIST);

      funcResponse = resUtil.success(logMsgs.NO_PLAYLIST_GENERATED);
    }

    return funcResponse
  } catch (err) {
    console.log(err);
    if (err.message === 'User not registered in the Developer Dashboard') { 
      await bot.sendMessage(chatId, `You are not enabled for this beta test. Kindly contact the developer to grant you access`)
    } else {
      await bot.sendMessage(chatId, staticBotMsgs.ERROR_GEN_PLAYLIST);
    }

    err.message = `CONVERT-PLAYLIST-REQ-HANDLER: ${err.message}`;
    throw err;
  } finally {
    timeLogger.log();
  }
};
