const axios = require('axios');
const cosmo_surfer = require('./cosmo_util');
const spotify_helper = require('./spotify_helper');

const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}` },
});

module.exports = async function (context, request, database, container, bot) {
    const body = await request.json();
    //Check for bot kick event and video_note messages
    if (body.my_chat_member) {
        bot.sendMessage(body.my_chat_member.chat.id, '🤖');
        context.log('User kicked me out of the group');
        return {
            status: 200,
            body: 'User kicked me out of the group',
        };
    } else if (body.video_note) {
        context.log('Video note received');
        bot.sendMessage(body.message.chat.id, "I'm incapable of processing video notes.");
        return {
            status: 200,
            body: "Video note received, but I'm incapable of processing video notes.",
        };
    }

  //retrieve chat ID
    const { chat: { id: chatId } } = body.message;

    try {
        //retrieve chat history
        let messages = await cosmo_surfer.getChatHistory(chatId, database, container);
        //add new message to chat history
        messages.push({ role: 'user', content: body.message.text });
        //retrieve prompt for non-conversation messages
        const prompt_req = body.message.text.toLowerCase();
        let imageUrls = [];
        let response = null;

        switch (true) {
            case prompt_req === '/clear':
                //clear chat history
                context.log('Clearing chat history');
                await cosmo_surfer.deleteChatHistory(chatId, database, container);
                await bot.sendMessage(chatId, 'Chat history cleared');
                return {
                    status: 200,
                    message: 'Chat history cleared',
                };
            case prompt_req === '/start':
                //start conversation
                await bot.sendMessage(
                    chatId,
                    `Hi, I'm Chat Assist Bot. I can help you with your daily tasks. You can ask me to create an image, search for a movie, or even get the weather forecast. I can also help you with your homework. Just reply with /help to see all the commands I can do. Please note that chats are stored until you clear them using /clear command.`,
                );
                return {
                    status: 200,
                    message: 'Conversation started',
                };
            case prompt_req === '/help':
                //help message
                await bot.sendMessage(
                    chatId,
                    `Hi, simply ask any questions and I will try to answer them. You can also ask me to create an image by asking me to create an image of a <your image prompt here>. You can also generate a spotify playlist by asking me to 'Create a playlist, Mood - <describe the context or your mood>. Preferred Artist -  <describe the preferred artists or genres>. If I don't respond, please send /clear to clear the chat history and start again. `,
                );
                return {
                    status: 200,
                    message: 'Help message sent',
                };
            case prompt_req.includes('create an image'):
                //create image prompt
                const imageMessage = prompt_req.replace('create an image', '');
                //send image prompt to OpenAI
                const imageResponse = await openAI_API.post('/images/generations', {
                    prompt: imageMessage,
                    n: 2,
                    size: '1024x1024',
                });
                imageUrls = imageResponse.data.data;
                //create media group
                const media = imageUrls.map((url) => ({
                    type: 'photo',
                    media: url.url,
                }));
                //send media group
                await bot.sendMediaGroup(chatId, media).catch((err) => {
                    context.log('Error sending image', err);
                });
                messages.push({ role: 'assistant', content: imageUrls });
                //update chat history
                await cosmo_surfer.updateChatHistory(chatId, messages, database, container);
                return {
                    status: 200,
                    images: imageUrls,
                };
            case prompt_req.includes('create a playlist'):
                //create playlist prompt
                await bot.sendMessage(chatId, "You'll have to give me a minute or more 🌝, I'll send your playlist once I'm done.");
                let playlistMessage = prompt_req.replace(
                    'create a playlist',
                    'Can you recommend 10 songs that I might enjoy, return them in JSON body with each song in this format (name,artist,album)',
                );
                const playlist_response = await openAI_API.post('/chat/completions', {
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    messages: [{ role: 'user', content: playlistMessage }],
                }).catch(async (err) => {
                    context.log('Error getting response from OpenAi', err);
                    await bot.sendMessage(chatId, "I'm sorry, I ruined your playlist 😢. Please try again in a minute while I gather my thoughts.");
                });
                await bot.sendMessage(chatId, 'Still working on it..., my creator is still working on making me faster 🤖. In the meantime,  take me as I am 🤗.');
                let songs = playlist_response.data.choices[0].message.content;
                let spotify_query = null
                try {
                    spotify_query = JSON.parse(songs.substring(songs.indexOf('['), songs.lastIndexOf(']') + 1))
                } catch (error) {
                    context.log('Error parsing Songs', error);
                    await bot.sendMessage(chatId, "I'm sorry, I ruined your playlist 😢. Please try again in a minute while I gather my thoughts.");
                }

                const spotify_access_token = await spotify_helper.refreshAccessToken(process.env.REFRESH_TOKEN);
                const spotify_IDs = await spotify_helper.searchSongs(spotify_query, spotify_access_token, context)
                await bot.sendMessage(chatId, 'Almost done..., I promise 🤞.');

                if (spotify_IDs) {
                    const spotify_user_id = process.env.SPOTIFY_USER_ID;
                    const username = body.message?.from?.first_name;
                    const add_track = await spotify_helper.addSongsToPlaylist(
                        spotify_user_id,
                        username,
                        spotify_IDs,
                        spotify_access_token,
                        context,
                    ).catch(async (err) => {
                        context.log('Error creating Playlist', err);
                        await bot.sendMessage(chatId, "I'm sorry, I was 👌🏻 close to creating your playlist 😢. Please try again in a minute while I gather my thoughts.");
                    });;
                    await bot.sendMessage(chatId, `Here's your playlist 🤖, as promised : ${add_track}.`);
                    await bot.sendMessage(chatId, ' If you do not have a Spotify account, you can visit https://soundiiz.com/ to convert the playlist to your preferred music service.');
                    return {
                        status: 200,
                        message: 'Playlist created',
                        playlist: add_track,
                    };
                } else {
                    await bot.sendMessage(chatId, "I'm sorry, I ruined your playlist 😢. Please try again in a minute while I gather my thoughts.");
                    return {
                        status: 200,
                        message: 'No songs recommended.',
                    };
                }

            default:
                const history = messages;
                if (messages?.length > 7) messages.shift();
                context.log('messages---------', messages);
                const prompt_message = messages.filter((msg) => {
                    if (msg.role === 'assistant' && msg.content?.length > 1000) {
                        return false;
                    } else if (msg.role === 'assistant' && msg.content[0]?.url) {
                        return false;
                    } else if (msg.role === 'user' && msg.content?.includes('create an image')) {
                        return false;
                    }
                    return true;
                });
                response = await openAI_API.post('/chat/completions', {
                    model: 'gpt-3.5-turbo',
                    messages: prompt_message,
                });

                try {
                    await bot.sendMessage(chatId, response.data.choices[0].message.content);
                } catch (error) {
                    context.log(`Error when sending message: ${error}`);
                    throw error;
                }
                const ai_response = { role: 'assistant', content: response.data.choices[0].message.content };
                history.push(ai_response);
                await cosmo_surfer.updateChatHistory(chatId, history, database, container);
                return {
                    status: 200,
                    message: 'Message sent.',
                };
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
            message: error.message || 'Internal Server Error',
        };
    }
};
