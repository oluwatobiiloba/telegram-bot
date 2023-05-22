require('dotenv').config();
const { app } = require('@azure/functions');
const chatBox = require('../services/functions/chat-box');
const createBot = require('../utils/createTelegramBot');

const { BOT_TOKEN, BOT_WEBHOOK } = process.env;
const bot = createBot(BOT_TOKEN, BOT_WEBHOOK);

app.http('chatbox', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: (request, context) => chatBox(request, context, bot),
});
