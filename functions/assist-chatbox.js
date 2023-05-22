const { app } = require('@azure/functions');
const chatBox = require('../services/functions/chat-box');
const createBot = require('../utils/createTelegramBot');

const { ASSIST_BOT_TOKEN, ASSIST_BOT_WEBHOOK } = process.env;
const bot = createBot(ASSIST_BOT_TOKEN, ASSIST_BOT_WEBHOOK);

app.http('assist_chatbox', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: (request) => chatBox(request, bot),
});
