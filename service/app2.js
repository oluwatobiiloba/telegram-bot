// Require the dotenv library to access environment variables.
require('dotenv').config();

// Require the axios library for sending HTTP requests.
const axios = require('axios');

// Create an instance of the axios client with a base URL and headers that contain an access token.
const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_TOKEN}` }
});

// Require an external utility module called "cosmo_util".
const cosmo_surfer = require('./cosmo_util')

// Export an async function that takes in various parameters, including a request object and a bot object.
module.exports = async function (context, request, database, container, bot) {

    // Get the JSON data from the request object's body.
    const body = await request.json();

    // Log the request body for debugging purposes.
    context.log("Request body", body);

    // If the message is related to a user kicking the bot out of a group chat, send a notification and return a response object.
    if (body.my_chat_member) {
        bot.sendMessage(body.my_chat_member.chat.id, "🤖")
        context.log("User Kicked me out of the group");
        return {
            status: 200,
            body: "User Kicked me out of the group"
        }
    } else if (body.video_note) {

        // If the message contains a video note, send a notification and return a response object.
        context.log("Video note received");
        bot.sendMessage(body.message.chat.id, "I'm incapable of processing video notes.")
        return {
            status: 200,
            body: "Video note received"
        }
    }

    // Get the chat ID from the message.
    const { chat: { id: chatId } } = body.message;

    try {
        // Log the request body for debugging purposes.
        context.log("Request body", request.body);

        // Get the chat history messages associated with the chat ID using the cosmo_util module.
        let messages = await cosmo_surfer.getChatHistory(chatId, database, container);
        // Add the current message to the messages list as a user message.
        messages.push({ role: "user", content: body.message.text });
        // Convert the message text to lowercase and store it in a variable called "prompt_req".
        let prompt_req = body.message.text.toLowerCase();

        // Declare an empty array to hold image URLs and a null response variable.
        let imageUrls = [];
        let response = null;

        // Use a switch statement to check for specific types of requests based on the prompt_req variable.
        switch (true) {
            case prompt_req.includes("create an image"):
                // If the chat message includes a prompt to create an image, log the request body for debugging purposes.
                context.log("Request body", body);
                // Strip the "create an image" prompt from the message text and store it in a variable called "imageMessage".
                const imageMessage = prompt_req.replace("create an image", "");
                // Send a POST request to the OpenAI API's "/images/generations" endpoint with the imageMessage prompt and other parameters.
                const imageResponse = await openAI_API.post('/images/generations', {
                    prompt: imageMessage,
                    n: 2,
                    size: "1024x1024"
                });
                // Store the generated image URLs in the imageUrls array, and format them as media objects.
                imageUrls = imageResponse.data.data;
                const media = imageUrls.map(url => ({
                    type: 'photo',
                    media: url.url
                }));
                // Send a media group message containing the generated images to the chat.
                const chatResponse = await bot.sendMediaGroup(chatId, media);
                context.log(chatResponse);
                // Add the image URLs to the messages list as an assistant message.
                messages.push({ role: "assistant", content: imageUrls });
                context.log(messages);
                // Update the chat history in the database with the new messages list using the cosmo_util module.
                await cosmo_surfer.updateChatHistory(chatId, messages, database, container);
                return {
                    status: 200,
                    body: response.data.choices[0].message.content,
                }
            case prompt_req === "/clear":
                // If the message asks to clear the chat history, call the relevant function from the cosmo_util module and send a notification to the chat.
                context.log("Clearing chat history");
                await cosmo_surfer.deleteChatHistory(chatId, database, container);
                await bot.sendMessage(chatId, "Chat history cleared");
                return {
                    status: 200,
                    body: "Chat history cleared",
                }

            case prompt_req === "/start":
                // If the message asks to start chatting, send an introduction message to the chat.
                await bot.sendMessage(chatId, "Hi, I'm Chat Assist Bot. I can help you with your daily tasks. You can ask me to create an image, search for a movie, or even get the weather forecast. I can also help you with your daily tasks. You can ask me to create an image, search for a movie, or even get the weather forecast. Reply with /help to see all the commands I can do. Please note that chats are stored until you clear them using /clear command.");
                return {
                    status: 200,
                    body: "Conversation started",
                }
            case prompt_req === "/help":
                // If the message asks for help, send a help message to the chat.
                await bot.sendMessage(chatId, "Hi, simply ask any questions and I will try to answer them. You can also ask me to create an image by asking me to create an image of a <your image prompt here>. If I don't respond, please send /clear to clear the chat history and start again. ");
                return {
                    status: 200,
                    body: "Help message sent",
                }
            default:
                // If none of the other cases match, assume the user wants a response generated by the OpenAI API's chatbot feature.
                let history = messages
                if (messages?.length > 7) messages.shift();
                context.log("messages---------", messages);
                // Filter the messages list to remove messages that are too long or have already been processed by the chatbot.
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

                // Send a POST request to the OpenAI API's "/chat/completions" endpoint with the prompt_message parameter.
                response = await openAI_API.post('/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: prompt_message
                });

                try {
                    // Send the generated response as a message to the chat using the bot object.
                    const chatResponse = await bot.sendMessage(chatId, response.data.choices[0].message.content);
                    context.log(chatResponse);
                } catch (error) {
                    // If there is an error sending the message, log the error and throw it.
                    context.log(`Error when sending message: ${error}`);
                    throw error;
                }
                // Add the chatbot response to the messages list as an assistant message.
                let ai_response = { role: "assistant", content: response.data.choices[0].message.content }
                history.push(ai_response);

                // Update the chat history in the database with the updated messages list using the cosmo_util module.
                await cosmo_surfer.updateChatHistory(chatId, history, database, container);
                return {
                    status: 200,
                    body: response.data.choices[0].message.content,
                }
        }
    } catch (error) {
        // If there is an error processing the request or sending a response, log the error and return an error response object.
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
