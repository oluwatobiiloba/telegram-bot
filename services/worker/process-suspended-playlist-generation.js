const resUtil = require('../../utils/res-util');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');
const createPlaylist = require('../request-handlers/create-playlist');

async function service(body, workerBot) {
  const processedData = {
    prompt: body.text,
    chatId: body.chatId || body.chat?.id,
    bot: workerBot,
    body: body
  }
  return createPlaylist(processedData);
}

module.exports = service;
