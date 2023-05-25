const appInsights = require('applicationinsights');
const logger = require('../utils/logger');
const resUtil = require('../utils/res-util');
const createTelegramBot = require('../utils/createTelegramBot');
appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start();


module.exports = async function (message, context) {
    const { name, data } = message;
    const { body, bot_token } = data;

    
    try {
        const workerBot = createTelegramBot(bot_token);
        const service = require(`../services/worker/${name}`);
        const response = await service(body, workerBot);

        if (response.status === 200) {
            logger.info(response.data, `JOB-COMPLETED-${name.toUpperCase()}`);
            logger.flush();

            appInsights.defaultClient.trackEvent({
                name: 'Job completed',
                properties: {
                    job: name,
                  message: response.body.message,
                  result: response.body.data,
                },
              });
        }
        return response;
    } catch (error) {
        console.log(error);
        logger.error(error, `JOB-FAILED-${name.toUpperCase()}`);
        appInsights.defaultClient.trackException({
            exception: error,
            properties: {
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