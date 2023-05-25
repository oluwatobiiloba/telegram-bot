const appInsights = require('applicationinsights');
const logger = require('../utils/logger');
const resUtil = require('../utils/res-util');
const createTelegramBot = require('../utils/createTelegramBot');
appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();


module.exports = async function (message, context) {
    const { name, data: { body, botToken } } = message;
    
    try {
        const workerBot = createTelegramBot(botToken);
        const service = require(`../services/worker/${name}`);
        const response = await service(body, workerBot);

        if (response.status === 200) {
            logger.info(response.data, `JOB-COMPLETED-${name.toUpperCase()}`);
            appInsights.defaultClient.trackEvent({
                name: `JOB-COMPLETED-${name.toUpperCase()}`,
                properties: {
                    job: name,
                  message: response.body.message,
                  result: response.body.data,
                },
              });
        }
        return response;
    } catch (error) {
        // console.log(error);
        logger.error(error, `JOB-FAILED-${name.toUpperCase()}`);
        appInsights.defaultClient.trackException({
            exception: error,
            properties: {
                name: `JOB-FAILED-${name.toUpperCase()}`,
                job: name,
                message: response.body.message,
                result: response.body.data,
            },
        });
        
        return resUtil.error(500, error);
    }finally {
        logger.flush();
    }
 }