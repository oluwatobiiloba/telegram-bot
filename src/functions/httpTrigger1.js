const { app } = require('@azure/functions');
const application = require('../../service/app2')
const TelegramBot = require('node-telegram-bot-api');


app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const bot = new TelegramBot(process.env.ASSIST_BOT_TOKEN);
        bot.setWebHook('https://chat-assist-bot.azurewebsites.net/api/httptrigger1');
        let response = await application(context, request, 'ChatDB', 'chatHistoryBot', bot)
        return { body: response }
    }
});

