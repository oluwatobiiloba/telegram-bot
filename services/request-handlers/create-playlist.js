const { staticBotMsgs, promptMsgs, logMsgs, dynamicBotMsgs } = require('../../messages');
const { ACTIVE_AI_PROVIDER, MAX_PLAYLIST_LENGTH } = process.env;
const provideMap = new Map([
  ['cloudfare', 'cloudfare-ai-worker'],
  ['openai', 'open-AI'],
])
const aiDao = require(`../../daos/${provideMap.get(ACTIVE_AI_PROVIDER)}`);
const chatDao = require('../../daos/chat-history');
const musicDao = require('../../daos/spotify');
const resUtil = require('../../utils/res-util');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');
const { generatePrompt } = require('../../utils/prompt-builder');

async function handler({ prompt, chatId, bot, body }) {
  const timeLogger = new TimeLogger(`CREATE-PLAYLIST-DURATION-${Date.now()}`);

  try {
    let funcResponse;
    const chatLog = [{ role: 'user', content: prompt }];

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[0]);

    // const playlistMessage = prompt.replace('create a playlist', `${promptMsgs.CREATE_PLAYLIST}`);
    //const playlistMessage = `${prompt}, ${promptMsgs.CREATE_PLAYLIST}`;

    const cleanInput = prompt.replace('create a playlist', "").trim();
    prompt = generatePrompt({
      userInput: cleanInput,
      module: "playlist-generator"
    })

    timeLogger.start('getting-AI-list');

    const choices = await aiDao.prompt(prompt);

    timeLogger.end('getting-AI-list');

    await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[1]);

    if (!choices) {
      throw new Error(logMsgs.NO_AI_RESPONSE);
    }
    let aiReply;
    if(Array.isArray(choices)) {
      aiReply = choices[0]?.message?.content;
    } else {
      aiReply = choices.result?.response
    }

    let songList = aiReply.substring(aiReply.indexOf('['), aiReply.lastIndexOf(']') + 1);

    logger.info({ songList: songList }, `CREATE-PLAYLIST-${Date.now()}`);

    songList = JSON.parse(songList);

    logger.info({ prompt: prompt, aiResponse: songList }, `CREATE-PLAYLIST-${Date.now()}`);

    if (Array.isArray(songList) && songList.length < (MAX_PLAYLIST_LENGTH || 10)) {
      try {
         timeLogger.start('getting-additional-AI-list');

        const promptList = songList.map(song => song.name);
        prompt = generatePrompt({
          userInput: promptList,
          module: "playlist-addition-generator",
          prevContext: cleanInput
        })

        const choices = await aiDao.prompt(prompt);

        timeLogger.end('getting-additional-AI-list');

        await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[4]);

        if (!choices) {
          throw new Error(logMsgs.NO_AI_RESPONSE);
        }
        if(Array.isArray(choices)) {
          aiReply = choices[0]?.message?.content;
        } else {
          aiReply = choices.result?.response
        }

        let additionalSongList = aiReply.substring(aiReply.indexOf('['), aiReply.lastIndexOf(']') + 1);

        logger.info({ songList: additionalSongList }, `CREATE-PLAYLIST-ADDITION${Date.now()}`);

        songList = songList.concat(JSON.parse(additionalSongList));
      } catch (error) {
        logger.error(error, `CREATE-PLAYLIST-ADDITION${Date.now()}`);
      }

    }

    logger.info({ playlist: songList }, `CHECK-PLAYLIST-${Date.now()}`);

    // timeLogger.start('getting-access-token');

    // const accessToken = await musicDao.getAccessToken(process.env.REFRESH_TOKEN);

    // timeLogger.end('getting-access-token');

    // await bot.sendMessage(chatId, staticBotMsgs.GEN_PLAYLIST_SEQ[2]);

    const { name, spotifyTokens } = body.user;

    if (spotifyTokens) {
      const user = {
        id: spotifyTokens.id,
        username: name,
      };

      timeLogger.start('creating-playlist');

      const playlist = await musicDao.createPlaylist(songList, spotifyTokens.accessToken, { user });

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
}

handler.middlewares = ['spotifyauth'];
module.exports = handler;
