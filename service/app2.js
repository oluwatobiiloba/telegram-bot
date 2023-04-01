require('dotenv').config();
const axios = require('axios');
const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_TOKEN}` }
});
const cosmo_surfer = require('./cosmo_util')
const spotify_helper = require('./spotify_helper')



module.exports = async function (context, request, database, container, bot) {
    const body = await request.json();


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


        let messages = await cosmo_surfer.getChatHistory(chatId, database, container);
        messages.push({ role: "user", content: body.message.text });
        let prompt_req = body.message.text.toLowerCase();

        let imageUrls = [];
        let response = null;


        switch (true) {
            case prompt_req.includes("create an image"):
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
                await bot.sendMediaGroup(chatId, media);
                messages.push({ role: "assistant", content: imageUrls });
                await cosmo_surfer.updateChatHistory(chatId, messages, database, container);
                return {
                    status: 200,
                    body: response.data.choices[0].message.content,
                }
            case prompt_req.includes("create a playlist"):
                context.log("Creating a playlist", body);
                await bot.sendMessage(chatId, "You'll have to give me a minute, I'll send your playlist once I'm done");
                let playlistMessage = prompt_req.replace("create a playlist", "Can you recommend 10 songs that I might enjoy, return them in JSON body with each song in this format (name,artist,album)");
                const playlist_response = await openAI_API.post('/chat/completions', {
                    model: "gpt-3.5-turbo",
                    temperature: 0.7,
                    messages: [{ role: "user", content: playlistMessage }]
                });
                await bot.sendMessage(chatId, "still working on it...");
                let songs = playlist_response.data.choices[0].message.content
                const spotify_query = JSON.parse(songs.substring(songs.indexOf("["), songs.lastIndexOf("]") + 1));
                const spotify_access_token = await spotify_helper.refreshAccessToken(process.env.REFRESH_TOKEN);
                const spotify_IDs = await spotify_helper.searchSongs(spotify_query, spotify_access_token, context);

                if (spotify_IDs) {
                    let spotify_user_id = process.env.SPOTIFY_USER_ID
                    let username = body.message?.from?.first_name
                    const add_track = await spotify_helper.addSongsToPlaylist(spotify_user_id, username, spotify_IDs, spotify_access_token, context);
                    context.log("Add Track", add_track);
                    await bot.sendMessage(chatId, `Here's your playlist : ${add_track}`);
                    return {
                        status: 200,
                        add_track
                    };

                } else {
                    bot.sendMessage(chatId, "I'm sorry, I couldn't process this request. Please try again in a minute.");
                    return {
                        status: 200,
                        message: 'I\'m sorry, I couldn\'t process this request. Please try again in a minute'
                    }
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
