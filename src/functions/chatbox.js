const { app } = require('@azure/functions');
const application = require('../../service/app')

app.http('chatbox', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        let response = await application(context, request)
        return { body: response }
    }
});
