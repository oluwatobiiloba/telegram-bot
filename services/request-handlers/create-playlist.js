const { staticBotMsgs, promptMsgs, logMsgs, dynamicBotMsgs } = require('../../messages');
const aiDao = require('../../daos/open-AI');
const chatDao = require('../../daos/chat-history');
const musicDao = require('../../daos/spotify');
const authDao = require('../../daos/auth')
const resUtil = require('../../utils/res-util');
const logger = require('../../utils/logger');
const { decryptRefreshToken } = require('../../utils/encryption')
const TimeLogger = require('../../utils/timelogger');
const { app } = require('@azure/functions');

module.exports = async function ({ prompt, chatId, bot, body }) {
  const timeLogger = new TimeLogger(`CREATE-PLAYLIST-DURATION-${Date.now()}`);

  let REFRESH_TOKEN = null;
  let funcResponse;

  try {
    const userAuth = await authDao.getAuth(chatId)

    if (!userAuth || !userAuth.spotify) {
      await bot.sendMessage(chatId, `You do not have a spotify account linked to your telegram account. Kindly use this link to link your account: http://localhost:7071/api/spotify?chat_id=${chatId}`);
      const suspendedJobData = { prompt, chatId, bot, body }
      await authDao.createAuth(chatId, null , suspendedJobData )
      return funcResponse = resUtil.success(logMsgs.NO_SPOTIFY_ACCOUNT_LINKED);
    } else {
      const {spotify: { hashedRefreshToken : { iv , encryptedToken}  }} = userAuth
      REFRESH_TOKEN = decryptRefreshToken(encryptedToken, iv)
    }

    const chatLog = [{ role: 'user', content: prompt }];

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[0]);

    // const playlistMessage = prompt.replace('create a playlist', `${promptMsgs.CREATE_PLAYLIST}`);
    const playlistMessage = `${prompt}, ${promptMsgs.CREATE_PLAYLIST}`;

    timeLogger.start('getting-AI-list');

    const choices = await aiDao.prompt(playlistMessage);

    timeLogger.end('getting-AI-list');

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[1]);

    if (!choices) {
      throw new Error(logMsgs.NO_AI_RESPONSE);
    }

    const aiReply = choices[0]?.message?.content;

    let songList = aiReply.substring(aiReply.indexOf('['), aiReply.lastIndexOf(']') + 1);

    songList = JSON.parse(songList);

    logger.info({ prompt: playlistMessage, aiResponse: songList}, `CREATE-PLAYLIST-${Date.now()}`);

    timeLogger.start('getting-access-token');

    const accessToken = await musicDao.getAccessToken(REFRESH_TOKEN);

    timeLogger.end('getting-access-token');

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[2]);

    if (accessToken) {
      const userProfile = await musicDao.getUserProfile(accessToken);
      const user = {
        id: userProfile.id,
        username: body.message?.from?.first_name,
      };

      timeLogger.start('creating-playlist');
      
      const appAccessToken = await musicDao.getAccessToken(process.env.REFRESH_TOKEN)


      const playlist = await musicDao.createPlaylist(songList,  accessToken , { user }, );

      timeLogger.start('creating-playlist');

      await bot.sendMessage(
        chatId,
        dynamicBotMsgs.getPlaylistGenerated(playlist) + '\n\n' + staticBotMsgs.GEN_PLAYLIST_SEQ[3]
      );

      funcResponse = resUtil.success({ message: logMsgs.PLAYLIST_GENERATED, data: playlist });
    } else {
      await bot.sendMessage(chatId, staticBotMsgs.ERROR_GEN_PLAYLIST);

      funcResponse = resUtil.success(logMsgs.NO_PLAYLIST_GENERATED);
    }

    chatLog.push({ role: 'assistant', content: aiReply });

    timeLogger.start('updating-chat-history');

    await chatDao.updateHistory(chatId, chatLog);

    timeLogger.end('updating-chat-history');

    return funcResponse;
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.ERROR_GEN_PLAYLIST);

    err.message = `CREATE-PLAYLIST-REQ-HANDLER: ${err.message}`;

    throw err;
  } finally {
    timeLogger.log();
  }
};
