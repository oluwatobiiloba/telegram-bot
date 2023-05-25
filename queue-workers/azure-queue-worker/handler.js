const appInsights = require('applicationinsights');
const logger = require('../../utils/logger');
const resUtil = require('../../utils/res-util');
const createTelegramBot = require('../../utils/createTelegramBot');
appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();


module.exports = async function (message, context) {
    const { name, data: { body, botToken } } = message;
    
    try {
        const workerBot = createTelegramBot(botToken);
        const service = require(`../services/worker/${name}`);
        const response = await service(body, workerBot);
        const jobId = context.bindingData.id

        if (response.status === 200) {
            logger.info(response.data, `JOB-COMPLETED-${jobId}`);
            appInsights.defaultClient.trackEvent({
                name: `JOB-COMPLETED-${jobId}`,
                properties: {
                    job: `JOB-COMPLETED-${jobId}`,
                    id: jobId,
                  message: response.body.message,
                  result: response.body.data,
                },
              });
        }
        return response;
    } catch (error) {
        // console.log(error);
        logger.error(error, `JOB-FAILED-${jobId}`);
        appInsights.defaultClient.trackException({
            exception: error,
            properties: {
                name: `JOB-FAILED-${jobId}`,
                id: jobId,
                message: response.body.message,
                result: response.body.data,
            },
        });
        
        return resUtil.error(500, error);
    }finally {
        logger.flush();
    }
 }