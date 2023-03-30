require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const axios = require('axios');
const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_TOKEN}` }
});
const fs = require('fs');
bot.setWebHook(process.env.BOT_WEBHOOK, {
    allowed_updates: ['message', 'edited_message', 'channel_post', 'edited_channel_post', 'inline_query', 'chosen_inline_result', 'callback_query', 'shipping_query', 'pre_checkout_query', 'poll', 'poll_answer']

});
bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM') {
        console.log('Telegram bot instance already running. Exiting...');
        process.exit(1);
    } else {
        console.log('An error occurred:', error);
    }
});
const { CosmosClient } = require('@azure/cosmos');
const { endpoint, key, database, container } = {
    endpoint: process.env.COSMO_ENDPOINT,
    key: process.env.COSMO_KEY,
    database: { id: 'ChatDB' },
    container: { id: 'chatHistory' }
};


const options = {
    endpoint,
    key,
    userAgentSuffix: 'Azure Function App'
};

async function downloadImage(url, filename) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filename, Buffer.from(response.data), 'binary');
}


const client = new CosmosClient(options);

module.exports = async function (context, request) {
    return new Promise(async (resolve, reject) => {
        try {
            const body = await request.json();

            switch (body.message.text) {
                case '/start':
                    context.log("Request body", body);
                    bot.onText(/\/start/, (msg, match) => {
                        context.log("Start message sent", msg);
                        const chatId = msg.chat.id;
                        const startMessage = "Welcome to the chatbot! Type /help to see the available commands.";
                        bot.sendMessage(chatId, startMessage);
                        resolve(startMessage);
                    }
                    );
                case '/help':
                    context.log("Request body", body);
                    bot.onText(/\/help/, (msg, match) => {
                        context.log("Help message sent", msg);
                        const chatId = msg.chat.id;
                        const helpMessage = "This is a chatbot that uses OpenAI's GPT-3 API to generate responses to your messages. You can start a conversation by sending any message. If you want to generate images, simply start your message with 'Create an image'";
                        bot.sendMessage(chatId, helpMessage);
                        resolve(helpMessage);
                    });
                    return resolve("Help message sent");
                case '/clearhistory':
                    context.log("Request body", body);
                    bot.onText(/\/clearhistory/, async (msg, match) => {
                        context.log("Clear history message sent", msg);
                        const chatId = msg.chat.id;
                        const clearHistoryMessage = "Chat history cleared";
                        bot.sendMessage(chatId, clearHistoryMessage);
                        await client.database(database.id).container(container.id).item(chatId.toString(), chatId.toString()).delete().then((result) => {
                            context.log('Item deleted successfully', result);
                        }).catch((err) => {
                            context.log(`Error deleting item: ${JSON.stringify(err)}`);
                        });;
                        resolve(clearHistoryMessage);
                    });
                    return resolve("Chat history cleared");


            }

            const chatId = body.message.chat.id.toString();
            const { resource } = await client.database(database.id).container(container.id).item(chatId, chatId).read();
            let chatHistory = resource;

            if (!chatHistory) {
                context.log("No chat history found, creating new one");
                chatHistory = await client.database(database.id).container(container.id).items.create({
                    id: chatId,
                    partitionKey: chatId,
                    chatHistory: []
                });
            }

            const messages = chatHistory?.chatHistory || [];

            if (messages.length > 5) messages.shift();

            const latestMessage = { role: "user", content: body.message.text };
            messages.push(latestMessage);
            //context.log(chatHistory)
            chatHistory.chatHistory = messages;
            let imageUrls = [];
            let response = null
            switch (true) {
                case body.message.text.includes("Create an image"):
                    context.log("Request body", body)
                    const imageMessage = body.message.text.replace("Create an image", "");
                    const imageResponse = await openAI_API.post('/images/generations', {
                        prompt: imageMessage,
                        n: 2,
                        size: "1024x1024"
                    });
                    context.log("Image response", imageResponse.data.data)
                    chatHistory.chatHistory.push({ role: "assistant", content: imageResponse.data.image });
                    await client.database(database.id).container(container.id).item(chatId, chatId).replace({
                        id: chatId,
                        partitionKey: chatId,
                        chatHistory: chatHistory.chatHistory
                    });
                    try {
                        const filenames = [];
                        imageUrls = imageResponse.data.data;
                        for (let i = 0; i < imageUrls.length; i++) {
                            const filename = `image${i}.jpg`;
                            await downloadImage(imageUrls[i], filename)
                            filenames.push(filename);
                        }
                        const media = filenames.map((filename) => ({ type: 'photo', media: fs.createReadStream(filename) }));
                        const chatResponse = await bot.sendMediaGroup(chatId, media);
                        context.log(`Message sent to ${chatResponse.chat.title} (${chatResponse.chat.id}).`);
                        resolve(imageUrls);
                    }
                    catch (error) {
                        context.log(`Error when sending message: ${error}`);
                    }
                    return imageUrls;
                default:
                    let prompt_message = messages.filter(msg => {
                        if (msg.role === 'assistant' && msg.content?.length > 100) {
                            return false;
                        }
                        return true;
                    });
                    context.log("Prompt message", prompt_message);
                    response = await openAI_API.post('/chat/completions', {
                        model: "gpt-3.5-turbo",
                        messages: prompt_message
                    });

                    chatHistory.chatHistory.push({ role: "assistant", content: response.data.choices[0].message.content });
                    await client.database(database.id).container(container.id).item(chatId, chatId).replace({
                        id: chatId,
                        partitionKey: chatId,
                        chatHistory: chatHistory.chatHistory
                    });

                    try {
                        const chatResponse = await bot.sendMessage(chatId, response.data.choices[0].message.content);
                        context.log(`Message sent to ${chatResponse.chat.title} (${chatResponse.chat.id}).`);
                    } catch (error) {
                        context.log(`Error when sending message: ${error}`);
                    }
                    resolve([response.data.choices[0].message.content]);
            }



        } catch (error) {
            reject(error);
        }
    });
};
