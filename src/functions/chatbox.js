// Load the dotenv package to use environmental variables
require('dotenv').config();

// Load the app module from Azure Functions library
const { app } = require('@azure/functions');

// Load the application module from service folder
const application = require('../../service/app2');

// Load and configure the TelegramBot using a BOT_TOKEN environment variable
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN);
bot.setWebHook(process.env.BOT_WEBHOOK);

// Handles HTTP requests for the 'chatbox' endpoint with anonymous authentication level
app.http('chatbox', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Call the application module function and pass in context, request, chat database name,
        // chat history container name, and the TelegramBot object
        let response = await application(context, request, 'ChatDB', 'chatHistory', bot)

        // Return the response as the body of the HTTP response
        return { body: response }
    }
});
