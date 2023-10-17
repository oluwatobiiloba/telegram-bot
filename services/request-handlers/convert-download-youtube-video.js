const ytdl = require("ytdl-core");
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const resUtil = require("../../utils/res-util");

async function handler({ prompt, chatId, bot, body }) {
    const isValidUrl = await ytdl.validateURL(prompt);
    const timeLogger = new TimeLogger(`CONVERT-YOUTUBLE-URL-DURATION-${Date.now()}`);

    try {
        let funcResponse;
        if (isValidUrl) {
            await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[0]);
            timeLogger.start("getting-video-details");
            const videoInfo = await ytdl.getInfo(prompt);
            timeLogger.end("getting-video-details");
            await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[1] + videoInfo.videoDetails.title);

            const videoStream = ytdl(prompt, { quality: 'highest' });
            const chunks = [];
            
            videoStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            videoStream.on('end', async () => {
                const videoBuffer = Buffer.concat(chunks);
                await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[2] + videoInfo.videoDetails.title);
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
        } else {
            await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_VIDEO);
            funcResponse = resUtil.success(logMsgs.NO_VIDEO_CONVERTED);
        }
        return funcResponse;
    } catch (err) {
        await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_VIDEO);
        err.message = `CONVERT-YOUTUBE-VIDEO-REQ-HANDLER: ${err.message}`;
        throw err;
    } finally {
        timeLogger.log();
    }
}

module.exports = handler;
