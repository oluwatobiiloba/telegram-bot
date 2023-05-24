const { app } = require('@azure/functions');
const chatBox = require('../services/functions/chat-box');
const createBot = require('../utils/createTelegramBot');
const logger = require('../utils/logger');

const { BOT_TOKEN, BOT_WEBHOOK } = process.env;
const bot = createBot(BOT_TOKEN, BOT_WEBHOOK);

app.http('chatbox', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: (request) => chatBox(request, bot),
});

logger.info(`Chatbox Function Started at ${new Date().toISOString()} on ${process.env.ENV}/${process.platform}.`, 'BOT-FUNC-STARTED');