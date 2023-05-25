const { app } = require('@azure/functions');
const logger = require('../utils/logger');
const handler = require('../queue-workers/handler');


app.storageQueue('queue', {
    connection: "AZURE_STORAGE_CONNECTION_STRING",
    queueName: process.env.QUEUE_NAME,
    handler: async (message, context) => { handler( message, context)}
});

logger.info(`Worker Function Started at ${new Date().toISOString()} on ${process.env.ENV}/${process.platform}.`, 'WORKER-FUNC-STARTED');