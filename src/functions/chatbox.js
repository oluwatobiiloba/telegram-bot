const { app: { http } } = require('@azure/functions');
const application = require('../../service/app2');
const TelegramBot = require('node-telegram-bot-api');

http('chatbox', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (context, req) => {
        const bot = new TelegramBot(`${process.env.BOT_TOKEN}`);
        bot.setWebHook(`${process.env.BOT_WEBHOOK}`);

        const response = await application(context, req, 'ChatDB', 'chatHistory', bot);

        return { body: response };
    }
});
