const { Queue } = require('bullmq');
const config = require('./config');
const constants = require('../utils/constants');

const queueConfig = config.get();
queueConfig.defaultJobOptions = { attempts: 2, backoff: 1000 };

const queue = new Queue(constants.CHATBOX_QUEUE_NAME, queueConfig);

module.exports = {
  add(name, data, opts) {
    return queue.add(name, data, opts);
  },
};
