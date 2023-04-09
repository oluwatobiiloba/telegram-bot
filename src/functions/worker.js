require('dotenv').config();
let appInsights = require('applicationinsights');
appInsights
    .setup(process.env.APPINSIGHTS_CONNECTIONSTRING)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
    .start();
const { Worker } = require('bullmq');
const application = require('../../service/worker_app')
const { Telegraf } = require('telegraf');



let result = null;
const worker = new Worker('chatbox', async (job) => {
    const { body, context, bot } = job.data;
    const res_bot = new Telegraf(bot.token);

    let response = await application(console, body, 'ChatDB', 'chatHistoryBot', res_bot.telegram)

    console.log('Job completed', response);
    result = response;
    return response;


    // Do your job processing here
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }
});

worker.on('completed', (job) => {
    console.log(`Completed job: ${JSON.stringify(job)}`);
    appInsights.defaultClient.trackEvent({
        name: "Job completed",
        properties: {
            jobId: job.id,
            result: result,
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
