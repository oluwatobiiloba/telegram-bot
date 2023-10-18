const ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const resUtil = require("../../utils/res-util");

async function downloadVideoAndReturnBuffer(url) {
    return new Promise(async (resolve, reject) => {
        const videoStream = ytdl(url);
        const chunks = [];

        videoStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        videoStream.on('end', () => {
            const videoBuffer = Buffer.concat(chunks);
            resolve(videoBuffer);
        });

        videoStream.on('error', (error) => {
            reject(error);
        });
    });
}


async function downloadVideo({ url, chatId, bot, timeLogger }) {
    const isValidUrl = await ytdl.validateURL(url);
    if (isValidUrl) {
        timeLogger.start("getting-video-details");
        const videoInfo = await ytdl.getInfo(url);
        timeLogger.end("getting-video-details");
        await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[1] + videoInfo.videoDetails.title);
        timeLogger.start("fetch-video");
        const videoBuffer = await downloadVideoAndReturnBuffer(url);
        timeLogger.end("fetch-video");
        timeLogger.start("send-video");
        await bot.sendDocument(chatId, videoBuffer, {}, {
            filename: videoInfo.videoDetails.title + ".mp4",
        });
        timeLogger.end("send-video");
    }
}

async function handler({ prompt, chatId, bot, body }) {
    const resolvedResp = await ytpl(prompt);
    const timeLogger = new TimeLogger(`CONVERT-YOUTUBLE-PLAYLIST-DURATION-${Date.now()}`);

    try {
        let funcResponse;
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
                    await bot.sendMessage(chatId, staticBotMsgs.ERROR_PLAYLIST_VIDEO_CONVERSION + item.title);
                }
               
            }

            funcResponse = resUtil.success({
                message: logMsgs.VIDEO_DOWNLOADED,
                data: resolvedResp.title,
            });
        } else {
            await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_VIDEO);
            funcResponse = resUtil.success(logMsgs.NO_VIDEO_CONVERTED);
        }
        return funcResponse;
    } catch (err) {
        await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_PLAYLIST);
        err.message = `CONVERT-YOUTUBE-PLAYLIST-REQ-HANDLER: ${err.message}`;
        throw err;
    } finally {
        timeLogger.log();
    }
}

module.exports = handler;