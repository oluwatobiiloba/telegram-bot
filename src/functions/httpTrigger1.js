const { app: { http } } = require('@azure/functions');
const application = require('../../service/app2')
const TelegramBot = require('node-telegram-bot-api');

http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (context, req) => {
        const bot = new TelegramBot('TOKEN_HERE');
        bot.setWebHook('https://chat-assist-bot.azurewebsites.net/api/httptrigger1');
        const response = await application(context, req, 'ChatDB', 'chatHistoryBot', bot)
        return { body: response }
    }
});
