require('dotenv').config();
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();

const { Worker } = require('bullmq');
const application = require('../../service/worker_app')
const { Telegraf } = require('telegraf');

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

const worker = new Worker('chatbox', async (job) => {
    const { body, context, bot } = job.data;
    const res_bot = new Telegraf(bot.token);

    const response = await application(console, body, 'ChatDB', 'chatHistoryBot', res_bot.telegram)

    console.log('Job completed', response);
    return response;

}, {
    connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD
    },
    concurrency: 5,
});

worker.on('completed', (job) => {
    console.log(`Completed job: ${JSON.stringify(job)}`);
    appInsights.defaultClient.trackEvent({
        name: "Job completed",
        properties: {
            jobId: job.id,
            result: job.returnvalue,
        },
    });
});

worker.on('failed', (job, error) => {
    console.log(`Failed job ${JSON.stringify(job)} with error ${error.message}`);
    appInsights.defaultClient.trackException({
        exception: err,
        properties: {
            jobId: job.id,
            jobData: job.data,
        },
    });
});

console.log('BullMQ worker started');
