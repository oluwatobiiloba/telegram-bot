require('dotenv').config();
const axios = require('axios');
const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_TOKEN}` }
});
const cosmo_surfer = require('./cosmo_util')



module.exports = async function (context, request, database, container, bot) {
    const body = await request.json();
    context.log("Request body", body);

    if (body.my_chat_member) {
        bot.sendMessage(body.my_chat_member.chat.id, "🤖")
        context.log("User Kicked me out of the group");
        return {
            status: 200,
            body: "User Kicked me out of the group"

        }
    } else if (body.video_note) {
        context.log("Video note received");
        bot.sendMessage(body.message.chat.id, "I'm incabable of processing video notes.")
        return {
            status: 200,
            body: "Video note received"

        }
    }
    const { chat: { id: chatId } } = body.message;
    try {
        context.log("Request body", request.body);

        let messages = await cosmo_surfer.getChatHistory(chatId, database, container);
        messages.push({ role: "user", content: body.message.text });
        let prompt_req = body.message.text.toLowerCase();

        let imageUrls = [];
        let response = null;


        switch (true) {
            case prompt_req.includes("create an image"):
                context.log("Request body", body);
                const imageMessage = prompt_req.replace("create an image", "");
                const imageResponse = await openAI_API.post('/images/generations', {
                    prompt: imageMessage,
                    n: 2,
                    size: "1024x1024"
                });
                imageUrls = imageResponse.data.data;
                const media = imageUrls.map(url => ({
                    type: 'photo',
                    media: url.url
                }));
                const chatResponse = await bot.sendMediaGroup(chatId, media);
                context.log(chatResponse);
                messages.push({ role: "assistant", content: imageUrls });
                context.log(messages);
                await cosmo_surfer.updateChatHistory(chatId, messages, database, container);
                return {
                    status: 200,
                    body: response.data.choices[0].message.content,
                }
            case prompt_req === "/clear":
                context.log("Clearing chat history");
                await cosmo_surfer.deleteChatHistory(chatId, database, container);
                await bot.sendMessage(chatId, "Chat history cleared");
                return {
                    status: 200,
                    body: "Chat history cleared",
                }

            case prompt_req === "/start":
                await bot.sendMessage(chatId, "Hi, I'm Chat Assist Bot. I can help you with your daily tasks. You can ask me to create an image, search for a movie, or even get the weather forecast. I can also help you with your daily tasks. You can ask me to create an image, search for a movie, or even get the weather forecast. Reply with /help to see all the commands I can do. Please note that chats are stored until you clear them using /clear command.");
                return {
                    status: 200,
                    body: "Conversation started",
                }
            case prompt_req === "/help":
                await bot.sendMessage(chatId, "Hi, simply ask any questions and I will try to answer them. You can also ask me to create an image by asking me to create an image of a <your image prompt here>. If I don't respond, please send /clear to clear the chat history and start again. ");
                return {
                    status: 200,
                    body: "Help message sent",
                }
            default:
                let history = messages
                if (messages?.length > 7) messages.shift();
                context.log("messages---------", messages);
                const prompt_message = messages.filter(msg => {
                    if (msg.role === 'assistant' && msg.content?.length > 1000) {
                        return false;
                    } else if (msg.role === 'assistant' && msg.content[0]?.url) {
                        return false;
                    } else if (msg.role === 'user' && msg.content?.includes("create an image")) {
                        return false;
                    }
                    return true;
                });
                context.log("Prompt message", prompt_message);

                response = await openAI_API.post('/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: prompt_message
                });

                try {
                    const chatResponse = await bot.sendMessage(chatId, response.data.choices[0].message.content);
                    context.log(chatResponse);
                } catch (error) {
                    context.log(`Error when sending message: ${error}`);
                    throw error;
                }
                let ai_response = { role: "assistant", content: response.data.choices[0].message.content }
                history.push(ai_response);

                await cosmo_surfer.updateChatHistory(chatId, history, database, container);
                return {
                    status: 200,
                    body: response.data.choices[0].message.content,
                }
        }
    } catch (error) {
        context.log(`Error when processing request: ${error}`);
        if (error.response) {
            context.log(error.response.status);
            context.log(error.response.data);
        } else {
            context.log(error.message);
        }
        return {
            status: 500,
            body: error,
        }
    }
};
