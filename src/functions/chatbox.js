require('dotenv').config();
const { app } = require('@azure/functions');
const application = require('../../service/app2')
const TelegramBot = require('node-telegram-bot-api');
const { Queue } = require('bullmq');
const queue = new Queue('chatbox', {
    connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }
});


app.http('chatbox', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const bot = new TelegramBot(process.env.BOT_TOKEN);
        bot.setWebHook(process.env.BOT_WEBHOOK, {
            drop_pending_updates: true
        });
        const body = await request.json();
        if (body.message.text === '/bull') {
            await queue.add('chatbox', { text: 'Hello from bullmq' });
            return {
                body: 'Job added to queue'

            }
        }
        let response = await application(context, body, 'ChatDB', 'chatHistory', bot)
        return { response }
    }
});
