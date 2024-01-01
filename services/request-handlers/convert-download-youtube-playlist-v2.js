const ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const { MAX_PLAYLIST_SIZE_YOUTUBE } = process.env;
const resUtil = require("../../utils/res-util");
const maxPlaylistSize = MAX_PLAYLIST_SIZE_YOUTUBE || 10; 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function downloadVideoAndReturnStream(url) {
   return ytdl.downloadFromInfo(await ytdl.getInfo(url))
}


async function downloadVideo({ url, chatId, bot, timeLogger }) {
    const isValidUrl = await ytdl.validateURL(url);
    if (isValidUrl) {
        timeLogger.start("getting-video-details");
        const videoInfo = await ytdl.getInfo(url);
        timeLogger.end("getting-video-details");
        await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[1] + videoInfo.videoDetails.title);
        timeLogger.start("fetch-video");
        const videoStream = await downloadVideoAndReturnStream(url);
        timeLogger.end("fetch-video");
        timeLogger.start("send-video");
        await bot.sendDocument(chatId, videoStream, {}, {
            filename: videoInfo.videoDetails.title + ".mp4",
            contentType: 'video/mp4',
        });
        delete videoBuffer;
        await sleep(1500)
        timeLogger.end("send-video");
    }
}

async function handler({ prompt, chatId, bot, body }) {
    const resolvedResp = await ytpl(prompt);
    const timeLogger = new TimeLogger(`CONVERT-YOUTUBLE-PLAYLIST-DURATION-${Date.now()}`);

    try {
        let funcResponse;
        if (resolvedResp.items.length > maxPlaylistSize) {
            await bot.sendMessage(chatId, dynamicBotMsgs.convertYoutubePlaylistFailedMax( maxPlaylistSize || 10));
            funcResponse = resUtil.success({
                message: logMsgs.convertYoutubePlaylistFailedMax( maxPlaylistSize || 10),
                data: resolvedResp.title,
            });
            return funcResponse;
        }
        if (resolvedResp.items.length) {
            for (const item of resolvedResp.items) {
                try {
                    await downloadVideo({
                        url: item.shortUrl,
                        chatId: chatId,
                        bot: bot,
                        timeLogger: timeLogger
                    });
                } catch (err) {
                    await bot.sendMessage(chatId, staticBotMsgs.ERROR_PLAYLIST_VIDEO_CONVERSION + item.title + " " + err.message);
                }
               
            }

            funcResponse = resUtil.success({
                message: logMsgs.VIDEO_DOWNLOADED,
                data: resolvedResp.title,
            });
            return funcResponse;
        } else {
            await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_VIDEO);
            funcResponse = resUtil.success(logMsgs.NO_VIDEO_CONVERTED);
            return funcResponse;
        }
    } catch (err) {
        await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_PLAYLIST);
        err.message = `CONVERT-YOUTUBE-PLAYLIST-REQ-HANDLER: ${err.message}`;
        throw err;
    } finally {
        timeLogger.log();
    }
}

module.exports = handler;
