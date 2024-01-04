const ytdl = require("ytdl-core");
const TimeLogger = require("../../utils/timelogger");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const fs = require('fs');

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

async function service(data, bot) {
    const { videoFilename, part, numberOfParts, partNumber, deleteFile } = data;
    let timeLogger = new TimeLogger(`PROCESS-VIDEO-PARTS-JOB-DURATION-${videoFilename}`);
    try {
        timeLogger.start(`splitting-part-${partNumber}-of-${numberOfParts}`);
        let partStream = await videoSplitter(videoFilename, part.start, part.end - part.start)
        timeLogger.end(`splitting-part-${partNumber}-of-${numberOfParts}`);
        timeLogger.start(`converting-part-${partNumber}-of-${numberOfParts}-to-buffer`);
        let partBuffer = await downloadVideoAndReturnBuffer(null, {}, partStream)
        timeLogger.end(`converting-part-${partNumber}-of-${numberOfParts}-to-buffer`);
        timeLogger.start(`sending-part-${partNumber}-of-${numberOfParts}-to-user`);
        await bot.sendVideo(chatId, partBuffer, {}, {
            filename: videoInfo.videoDetails.title.slice(0,12) + `part_${partNumber}` + ".mp4",
            contentType: 'video/mp4',
        });
        timeLogger.end(`sending-part-${partNumber}-of-${numberOfParts}-to-user`);
        partBuffer = [];
        if (deleteFile) {
            fs.unlink(videoFilename,(err) => {
                if (err) throw err;
              })
        }
    } catch (error) {
        error.message = `PROCESS-VIDEO-PARTS-JOB-ERROR-${partNumber} -> ${error.message}`;
        throw error;
      } finally {
        if (timeLogger) timeLogger.log();
      }
}
module.exports = service;