const ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const TimeLogger = require("../../utils/timelogger");
const { staticBotMsgs, logMsgs, dynamicBotMsgs } = require("../../messages");
const resUtil = require("../../utils/res-util");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const { MAX_PLAYLIST_SIZE_YOUTUBE, MAX_VIDEO_PART_SIZE } = process.env;
const maxPlaylistSize = MAX_PLAYLIST_SIZE_YOUTUBE || 10;
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const fs = require('fs');
const path = require('path');
async function getVideoSize(url) {
    try {
      const info = await ytdl.getInfo(url);
      const bitrate = info.formats[0].bitrate || 128;
      const lengthSeconds = info.videoDetails.lengthSeconds || 0;
      const videoSizeBytes = (bitrate / 8) * lengthSeconds;
      const videoSizeMB = videoSizeBytes / (1024 * 1024);
      return videoSizeMB;
    } catch (error) {
      console.error('Error getting video size:', error.message);
      throw error;
    }
  }

async function downloadVideoAndReturnBuffer(url, options = {}, videoStreamInput) {
  return new Promise(async (resolve, reject) => {
    let videoStream;
    if ( videoStreamInput && videoStreamInput instanceof stream.PassThrough) {
        videoStream = videoStreamInput
    } else if (url && !videoStreamInput) {
      videoStream = ytdl(url, options);
    } else {
      throw new Error("Please provide youtube url or a readable stream")
    }
    let chunks = [];

    videoStream.on('data', (chunk) => {
        chunks.push(chunk);
    });

    videoStream.on('end', async () => {
        const videoBuffer = Buffer.concat(chunks);
        chunks = [];
        await sleep(500);
        resolve(videoBuffer);
    });

    videoStream.on('error', (error) => {
        reject(error);
    });
  })
}

function computePartDurations(videoInfo, targetSizeMB) {
    const averageBitrate = videoInfo.averageBitrate;
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const durationInSeconds = videoInfo.approxDurationMs / 1000;
    const targetBitrate = targetSizeBytes * 8 / durationInSeconds;
    const numParts = Math.ceil(averageBitrate / targetBitrate);
    const partDurations = Array.from({ length: numParts }, (_, index) => {
      const start = (index * durationInSeconds) / numParts;
      const end = ((index + 1) * durationInSeconds) / numParts;
      return { start: start , end: end  };
    });
    return partDurations;
  }

async function downloadVideoandSendInBits(url, videoInfo, options = {}, bot, chatId, timeLogger) {
  return new Promise(async (resolve, reject) => {
    const outputPath = 'temp_videos';
    let videoFilename;

    try {
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      const partsDurationArray = computePartDurations(videoInfo.formats[0], MAX_VIDEO_PART_SIZE || 45);
      let partNumber = 1;
      const videoName = videoInfo.videoDetails.title.slice(0,10).replace(" ","_").trim()
      videoFilename = path.join(outputPath, videoName + '.mp4');
      timeLogger.start("fetch-video");
      const videoStream = ytdl(url,options);
      timeLogger.end("fetch-video");
      videoStream.pipe(fs.createWriteStream(videoFilename)).on('close', async () => {
        if (partsDurationArray.length) {
          for (const part of partsDurationArray) {
            timeLogger.start(`splitting-part-${partNumber}-of-${partsDurationArray.length}`);
            let partStream = await videoSplitter(videoFilename, part.start, part.end - part.start)
            timeLogger.end(`splitting-part-${partNumber}-of-${partsDurationArray.length}`);
            timeLogger.start(`converting-part-${partNumber}-of-${partsDurationArray.length}-to-buffer`);
            let partBuffer = await downloadVideoAndReturnBuffer(null, {}, partStream)
            timeLogger.end(`converting-part-${partNumber}-of-${partsDurationArray.length}-to-buffer`);
            timeLogger.start(`sending-part-${partNumber}-of-${partsDurationArray.length}-to-user`);
            await bot.sendVideo(chatId, partBuffer, {}, {
              filename: videoInfo.videoDetails.title.slice(0,12) + `part_${partNumber}` + ".mp4",
              contentType: 'video/mp4',
            });
            timeLogger.end(`sending-part-${partNumber}-of-${partsDurationArray.length}-to-user`);
            partBuffer = [];
            partNumber++
            sleep(700)
          }
        }
        fs.unlink(videoFilename,(err) => {
          if (err) throw err;
        })
        resolve(true)
      })
    } catch (error) {
      fs.unlink(videoFilename,(err) => {
        if (err) throw err;
      })
      reject(error);
    }
  })
}

async function videoSplitter(filename, start, duration) {
  return new Promise((resolve, reject) => {
    let ffmpegStream = ffmpeg(filename)
      .setStartTime(start)
      .setDuration(duration)
      .videoCodec('copy')
      .audioCodec('copy')
      .outputOptions('-movflags frag_keyframe+empty_moov')
      .format('mp4')
      .on('error', function (err) {
      })
      resolve(ffmpegStream.pipe())
  });
}

async function splitAndSendVideoParts({ url, chatId, bot, timeLogger,videoInfo}) {
    const isValidUrl = await ytdl.validateURL(url);
    const videoSize = await getVideoSize(url);
    if (isValidUrl && videoSize && videoSize > 48) {
        timeLogger.start("split-video-parts");
        await downloadVideoandSendInBits(url, videoInfo, { quality: "highest" }, bot, chatId,timeLogger)
      timeLogger.end("split-video-parts");
      return true
    }
}

async function downloadVideo({ url, chatId, bot, timeLogger }) {
  const isValidUrl = await ytdl.validateURL(url);
  const videoSize = await getVideoSize(url);
  if (isValidUrl && videoSize && videoSize < 48) {
    timeLogger.start("getting-video-details");
    const videoInfo = await ytdl.getInfo(url);
    timeLogger.end("getting-video-details");
    await bot.sendMessage(chatId, staticBotMsgs.DOWNLOAD_YOUTUBE_SEQ[1] + videoInfo.videoDetails.title);
    timeLogger.start("fetch-video");
    let videoBuffer = await downloadVideoAndReturnBuffer(url);
    timeLogger.end("fetch-video");
    timeLogger.start("send-video");
    await bot.sendVideo(chatId, videoBuffer, {}, {
        filename: videoInfo?.videoDetails?.title + ".mp4",
        contentType: 'video/mp4',
    });
    videoBuffer = [];
    await sleep(800)
    timeLogger.end("send-video");
  } else if (isValidUrl && videoSize && videoSize > 45) {
    timeLogger.start("getting-video-details");
    const videoInfo = await ytdl.getInfo(url);
    await bot.sendMessage(chatId, dynamicBotMsgs.youtubePlaylistLargeSize(videoInfo?.videoDetails?.title));
    timeLogger.end("getting-video-details");
    await splitAndSendVideoParts({ url, chatId, bot, timeLogger,videoInfo });
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
