const appInsights = require('applicationinsights');
const { app } = require('@azure/functions');
const logger = require('../utils/logger');
const resUtil = require('../utils/res-util');
const createTelegramBot = require('../utils/createTelegramBot');
appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();


app.storageQueue('queue', {
    connection: "AZURE_STORAGE_CONNECTION_STRING",
    queueName: process.env.QUEUE_NAME,
    handler: async (message, context) => {
        const { name, data } = message;
        const { body, bot_token } = data;
        
        try {
            const workerBot = createTelegramBot(bot_token);
            const service = require(`../services/worker/${name}`);
            const response = await service(body, workerBot);
    
            if (response.status === 200) {
                logger.info(response.data, `JOB-COMPLETED-${body.id}`);
                logger.flush();

                appInsights.defaultClient.trackEvent({
                    name: 'Job completed',
                    properties: {
                      jobId: job.id,
                      result: job.returnvalue,
                    },
                  });
            }
            return response;
        } catch (error) {
            console.log(error);
            logger.error(error, `JOB-FAILED-${body.id}`);
            appInsights.defaultClient.trackException({
                exception: error,
                properties: {
                  jobId: job.id,
                  jobData: job.data,
                },
            });
            
            return resUtil.error(500, error);
        }finally {
            logger.flush();
        }
     },
});

logger.info(`Worker Function Started at ${new Date().toISOString()} on ${process.env.ENV}/${process.platform}.`, 'WORKER-FUNC-STARTED');