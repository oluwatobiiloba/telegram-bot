const ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const resUtil = require("../../utils/res-util");

async function downloadVideoAndStream(url, chatId, bot) {
    const videoStream = ytdl(url, { quality: "highest" });

    videoStream.on('data', async (chunk) => {
        await bot.sendDocument(chatId, chunk, {}, { contentType: 'video/mp4' });
    });

    return new Promise((resolve, reject) => {
        videoStream.on('end', resolve);
        videoStream.on('error', reject);
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
        await downloadVideoAndStream(url, chatId, bot);
        timeLogger.end("fetch-video");
        timeLogger.start("send-video");
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
