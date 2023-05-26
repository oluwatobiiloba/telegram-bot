const resUtil = require('../../utils/res-util');
const logger = require('../../utils/logger');
const TimeLogger = require('../../utils/timelogger');
const createPlaylist = require('../request-handlers/create-playlist');

async function service(data) {
  return createPlaylist(data);
}

module.exports = service;
