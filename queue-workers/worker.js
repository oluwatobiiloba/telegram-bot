const appInsights = require('applicationinsights');
const { Worker } = require('bullmq');
const config = require('./config');
const constants = require('../utils/constants');
const logger = require('../utils/logger');

appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();

const workerFunc = async (job) => {
  const { body, bot } = job.data;

  const service = require(`../services/worker/${job.name}`);
  const response = await service(body, bot);

  return response;
};

const worker = new Worker(constants.CHATBOX_QUEUE_NAME, workerFunc, config.getWithConcurrency(5));

worker.on('completed', (job) => {
  logger.info(`Completed job:\n${job}`, job.id);
  logger.flush;
  appInsights.defaultClient.trackEvent({
    name: 'Job completed',
    properties: {
      jobId: job.id,
      result: job.returnvalue,
    },
  });
});

worker.on('failed', (job, error) => {
  logger.error(`Failed job with error ${error.message}:\n${job}`, job.id);
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
