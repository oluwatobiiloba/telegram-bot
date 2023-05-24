const { app } = require('@azure/functions');

app.storageQueue('queue', {
    connection: "process.env.AZURE_STORAGE_CONNECTION_STRING",
    queueName: process.env.QUEUE_NAME,
    handler: async (data) => {
        context.log('JavaScript queue trigger function processed work item', data);
     },
});

