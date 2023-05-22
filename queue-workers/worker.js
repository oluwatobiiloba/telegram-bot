require('dotenv').config();
const appInsights = require('applicationinsights');
const { Worker } = require('bullmq');
const config = require('./config');
const constants = require('../utils/constants');

appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();

const workerFunc = async (job) => {
  const { body, context, bot } = job.data;

  const service = require(`../services/worker/${job.name}`);
  const response = await service(context, body, bot);

  context.log('Job completed', response);
  return response;
};

const worker = new Worker(constants.CHATBOX_QUEUE_NAME, workerFunc, config.getWithConcurrency(5));

worker.on('completed', (job) => {
  console.log(`Completed job: ${JSON.stringify(job)}`);

  appInsights.defaultClient.trackEvent({
    name: 'Job completed',
    properties: {
      jobId: job.id,
      result: job.returnvalue,
    },
  });
});

worker.on('failed', (job, error) => {
  console.log(`Failed job ${JSON.stringify(job)} with error ${error.message}`);

  appInsights.defaultClient.trackException({
    exception: error,
    properties: {
      jobId: job.id,
      jobData: job.data,
    },
  });
});

console.log('BullMQ worker started');
