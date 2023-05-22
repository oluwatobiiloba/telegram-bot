const playlistConverter = require('../../daos/playlist-converter');
const musicDao = require('../../daos/spotify');
const { staticBotMsgs, logMsgs } = require('../../messages');
const { APPLE_REGEX } = require('../../utils/constants');
const { JSDOM } = require('jsdom');

module.exports = async function ({ prompt, chatId, bot, body }) {
  const appleUrl = prompt.match(APPLE_REGEX)[0];

  try {
    let funcResponse;

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[0]);

    const { playlistContent, image, tracks } = await playlistConverter.appleToSpotify(appleUrl);

    if (!tracks) throw new Error(logMsgs.NO_PLAYLIST_TRACK_INFO);

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[1]);

    const accessToken = await musicDao.getAccessToken(process.env.REFRESH_TOKEN);

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[2]);

    if (accessToken) {
      const user = {
        id: process.env.SPOTIFY_USER_ID,
        username: body.message?.from?.first_name,
      };

      const config = {
        name: playlistContent.name,
        description: playlistContent.description,
        author: playlistContent.author.name,
        isConverted: true,
        image,
        user,
      };

      const playlistURL = await musicDao.createPlaylist(tracks, accessToken, config);

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
  } catch (err) {
    await bot.sendMessage(chatId, staticBotMsgs.ERROR_GEN_PLAYLIST);

    err.message = `CONV-PLAYLIST-REQ-HANDLER: ${err.message}`;
    throw err;
  }
};
