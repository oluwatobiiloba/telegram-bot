const resUtil = require('../../utils/res-util');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');
const createPlaylist = require('../request-handlers/create-playlist');
const promptMapper = require('../../utils/prompt-mapper');

async function service(body, workerBot) {
  const timeLogger = new TimeLogger(`PROCESS-SUSPENDED-PLAYLIST-GENERATION-${Date.now()}`);

  const prompt = body.text || body.message.text;
  const chatId = body.chatId || body.chat?.id;
  const bot = workerBot;

  const handler = promptMapper(prompt);

  const handlerFunc = require(`../request-handlers/${handler}`);

  console.log('handlerFunc', handlerFunc);

  timeLogger.start(`running-${handler}-function`);

  const funcRes = await handlerFunc({ prompt, chatId, bot, body });

  timeLogger.end(`running-${handler}-function`);

  return funcRes;

}

module.exports = service;
