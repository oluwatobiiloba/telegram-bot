const logger = require('./logger');

class TimeLogger {
  constructor(logkey) {
    this.logKey = logkey;
    this.timeLog = {};
  }

  start(key) {
    this.timeLog[key] = {};
    this.timeLog[key].start = Date.now();
  }

  end(key) {
    const entry = this.timeLog[key];
    if (entry) {
      entry.end = Date.now();
      entry.duration = entry.end - entry.start;
    }
  }

  log() {
    logger.info(this.timeLog, this.logKey);
    logger.flush();
  }
}

module.exports = TimeLogger;
