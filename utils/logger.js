const { Logtail } = require('@logtail/node');

const logger = new Logtail(process.env.LOGGER_KEY);

logger.use(function (log) {
  return {
    dt: log.dt,
    level: log.level.toUpperCase(),
    tag: log.message || 'LOG-DATA-' + Date.now(),
    data: log.data,
    error: log.error,
  };
});

module.exports = {
  error(err, key) {
    logger.error(key, {
      error: {
        message: err.message,
        stackTrace: err.stack,
        context: err.context,
      },
    });
  },
  warn(data, key) {
    logger.warn(key, { data });
  },
  info(data, key) {
    logger.info(key, { data });
  },
  debug(data, key) {
    logger.debug(key, { data });
  },
  flush() {
    logger.flush();
  },
};

// OLD LOGGER
/*
const pino = require('pino');

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
  },
});

transport.on('error', (err) => {
  console.error('error caught', err);
});

const logger = pino(
  {
    level: process.env.LOGGER_LEVEL,
    messageKey: 'tag',
    nestedKey: 'data',
    customLevels: {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
      fatal: 50,
    },
    useOnlyCustomLevels: true,
    timestamp: () => `,"time": "${new Date().toISOString()}"`,
    base: undefined,
    formatters: {
      bindings(bindings) {
        return undefined;
      },

      level: (label) => ({ level: label }),
    },
  },
  transport
);

module.exports = logger;
*/
