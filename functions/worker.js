const { app } = require('@azure/functions');
const logger = require('../utils/logger');
const handler = require('../queue-workers/handler');


app.storageQueue('queue', {
    connection: "AZURE_STORAGE_CONNECTION_STRING",
    queueName: process.env.PROCESS_DOC_QUEUE,
    handler: async (message, context) => { handler( message, context)}
});

