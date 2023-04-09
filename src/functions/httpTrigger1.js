const { app } = require('@azure/functions');
const application = require('../../service/app2')
const TelegramBot = require('node-telegram-bot-api');
const regex = /[A-Za-z0-9_-]{22,}/;
const { Queue } = require('bullmq');

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const bot = new TelegramBot(process.env.ASSIST_BOT_TOKEN);
        bot.setWebHook('https://chat-assist-bot.azurewebsites.net/api/httptrigger1');
        const body = await request.json();
        const prompt_req_doc = body.message?.text || null
        const contains_id = prompt_req_doc?.match(regex) ? true : false

        if (contains_id) {
            await queue.add('chatbox', { body, context, bot }, { attempts: 2, backoff: 1000 });
            return {
                body: 'Job added to queue'

            }
        }
        let response = await application(context, body, 'ChatDB', 'chatHistoryBot', bot)
        return { body: response }
    }
});

