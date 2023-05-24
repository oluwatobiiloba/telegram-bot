const appInsights = require('applicationinsights');
const { Worker } = require('bullmq');
const config = require('./config');
const constants = require('../utils/constants');
const logger = require('../utils/logger');
const createTelegramBot = require('../utils/createTelegramBot');

appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();

const workerFunc = async (job) => {
  const { body, bot } = job.data;

  const workerBot = createTelegramBot(bot.token);

  const service = require(`../services/worker/${job.name}`);
  const response = await service(body,workerBot);

  return response;
};

const worker = new Worker(constants.CHATBOX_QUEUE_NAME, workerFunc, config.getWithConcurrency(5));

worker.on('completed', (job) => {
  const logData = {
    message: 'Completed job',
    resData: job.returnvalue,
  };

  logger.info(logData, `JOB-COMPLETED-${job.id}`);
  logger.flush();

  appInsights.defaultClient.trackEvent({
    name: 'Job completed',
    properties: {
      jobId: job.id,
      result: job.returnvalue,
    },
  });
});

worker.on('failed', (job, error) => {
  error.message = `Failed job with error: ${error.message}`;

  logger.error(error, `JOB-FAILED-${job.id}`);
  logger.flush();

  appInsights.defaultClient.trackException({
    exception: error,
    properties: {
      jobId: job.id,
      jobData: job.data,
    },
  });
});

console.log('BullMQ worker started');
logger.info(`BullMQ worker started at ${new Date().toISOString()} on ${process.env.ENV}/${process.platform}.`);