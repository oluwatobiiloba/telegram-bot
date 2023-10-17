const ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const resUtil = require("../../utils/res-util");

async function downloadVideo({ url, chatId, bot, timeLogger }) {
    const isValidUrl = await ytdl.validateURL(url);
    let funcResponse;
    if (isValidUrl) {
        timeLogger.start("getting-video-details");
        const videoInfo = await ytdl.getInfo(url);
        timeLogger.end("getting-video-details");
        await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[1] + videoInfo.videoDetails.title);

        const videoStream = ytdl(url, { quality: 'highest' });
        const chunks = [];
        
        videoStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        videoStream.on('end', async () => {
            const videoBuffer = Buffer.concat(chunks);
            timeLogger.start("sending-video");
            await bot.sendVideo(chatId, videoBuffer, {}, {
                filename: videoInfo.videoDetails.title + ".mp4",
            });
            timeLogger.end("sending-video");

            funcResponse = resUtil.success({
                message: logMsgs.VIDEO_DOWNLOADED,
                data: videoInfo.videoDetails.title,
            });
        });

        videoStream.on('error', (error) => {
            throw error;
        });
    }
}

async function handler({ prompt, chatId, bot, body }) {
    const resolvedResp = await ytpl(prompt);
    const timeLogger = new TimeLogger(`CONVERT-YOUTUBLE-PLAYLIST-DURATION-${Date.now()}`);

    try {
        let funcResponse;
        if (resolvedResp.items.length) {
            const downloadPromises = resolvedResp.items.map(async (item) => {
                await downloadVideo({
                    url: item.shortUrl,
                    chatId: chatId,
                    bot: bot,
                    timeLogger: timeLogger
                });
            });
            await Promise.all(downloadPromises);

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
