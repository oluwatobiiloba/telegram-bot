const ytdl = require("ytdl-core")
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const resUtil = require("../../utils/res-util");
async function handler({ prompt, chatId, bot, body }) {
    const isValidUrl = await ytdl.validateURL(prompt)
    const timeLogger = new TimeLogger(`CONVERT-YOUTUBLE-URL-DURATION-${Date.now()}`);

    try {
        let funcResponse;
        if (isValidUrl) {
            await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[0]);
            timeLogger.start("getting-video-details");
            const videoInfo = await ytdl.getInfo(prompt);
            timeLogger.end("getting-video-details");
            await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[1] + videoInfo.title);
            timeLogger.start("sending-video");
            const videoReadStream = ytdl(prompt);
            await bot.sendVideo(chatId, videoReadStream, {}, {
                filename: videoInfo.title
            });
            timeLogger.end("sending-video");
            await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[2] + videoInfo.title);
            funcResponse = resUtil.success({
                message: logMsgs.VIDEO_DOWNLOADED,
                data: videoInfo.title,
            });
            return funcResponse
        } else {
            await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_VIDEO);
            funcResponse = resUtil.success(logMsgs.NO_VIDEO_CONVERTED);
        }
        return funcResponse
    } catch (err) {
        await bot.sendMessage(chatId, staticBotMsgs.ERROR_CON_YOUTUBE_VIDEO);
        err.message = `CONVERT-YOUTUBE-VIDEO-REQ-HANDLER: ${err.message}`;
        throw err
    } finally {
        timeLogger.log();
    }

}


module.exports = handler