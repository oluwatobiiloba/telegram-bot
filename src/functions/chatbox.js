require('dotenv').config();
const { app } = require('@azure/functions'),
    application = require('../../service/app2');
const TelegramBot = require('node-telegram-bot-api');
const { Queue } = require('bullmq');
const regex = /[A-Za-z0-9_-]{22,}/;

const { BOT_TOKEN, BOT_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(BOT_WEBHOOK, {
    drop_pending_updates: true
});
const queue = new Queue('chatbox', {
    connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD
    }
});

app.http('chatbox', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const body = await request.json();
        const prompt_req_doc = body.message?.text || null
        const contains_id = prompt_req_doc?.match(regex) ? true : false
        const contains_apple_playlist_url = body.message.text.includes("https://music.apple.com/ng/playlist/") ? true : false

        if (contains_id && !contains_apple_playlist_url) {
            const job = await queue.add('chatbox', { body, context, bot }, { attempts: 2, backoff: 1000 });
            await bot.sendMessage(body.message.chat.id, `I'll get back to you shortly, I've got workers working on your request. Here's your ticket ID: ${job.id}`)
            return {
                body: 'Job added to queue'
            }
        }

        let response = await application(context, body, 'ChatDB', 'chatHistory', bot)
        return { response }
    }
});
