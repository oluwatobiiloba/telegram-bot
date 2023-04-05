require('dotenv').config();
const { app } = require('@azure/functions');
const application = require('../../service/app2')
const TelegramBot = require('node-telegram-bot-api');


app.http('chatbox', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const bot = new TelegramBot(process.env.BOT_TOKEN);
        bot.setWebHook(process.env.BOT_WEBHOOK);

        let response = await application(context, request, 'ChatDB', 'chatHistory', bot)
        return { response }
    }
});
