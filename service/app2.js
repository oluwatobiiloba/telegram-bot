const axios = require('axios');
const cosmo_surfer = require('./cosmo_util');
const spotify_helper = require('./spotify_helper');
const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}` },
});
const document_processing = require('./document_processing');
const help_text = require('../bot_helpers');
const bot_helpers = require('../bot_helpers');
const regex = /[A-Za-z0-9_-]{22,}/;
const apple_music_regex = /https:\/\/music\.apple\.com\/([a-z]{2})\/playlist\/([a-zA-Z0-9_-]+)\/pl\.u-([a-zA-Z0-9]+)/g

module.exports = async function (context, body, database, container, bot) {

    try {

        context.log('Request body', body);
        // const is_resume = body.message?.document && body.message?.document.mime_type === 'application/pdf' && body.message?.document?.file_name.toLowerCase().includes("resume")
        // const is_document = body.message?.document && body.message?.document.mime_type === 'application/pdf' && !body.message?.document?.file_name.toLowerCase().includes("resume")

        const { chat: { id: chatId } } = body.message;

        if (body.my_chat_member) {
            await bot.sendMessage(body.my_chat_member.chat.id, '🤖');
            context.log('User kicked me out of the group');
            return {
                status: 200,
                body: 'User kicked me out of the group',
            };
        } else if (body.message.video_note) {
            context.log('Video note received');
            await bot.sendMessage(body.message.chat.id, "I'm incapable of processing video notes.");
            return {
                status: 200,
                body: "Video note received, but I'm incapable of processing video notes.",
            };
        } else if (body.message?.document && body.message?.document.mime_type === 'application/pdf') {
            const fileId = body.message.document.file_id;
            const file_name = body.message?.document?.file_name
            let document = body.message?.document
            document.chatId = chatId

            await cosmo_surfer.uploadDocument(document, 'ChatDB', 'fileContainer', context)
            await bot.sendMessage(chatId, bot_helpers.document_upload)
            await bot.sendMessage(chatId, fileId)
            return {
                status: 200,
                body: "Document Received",
            }
        }
        //retrieve chat history
        let messages = await cosmo_surfer.getChatHistory(chatId, database, container);
        //add new message to chat history
        messages.push({ role: 'user', content: body.message.text });
        //retrieve prompt for non-conversation messages
        const prompt_req = body.message?.text?.toLowerCase() || "null";
        const prompt_req_doc = body.message?.text || null
        const contains_id = prompt_req_doc?.match(regex) ? true : false
        const contains_apple_playlist_url = body.message.text.includes("https://music.apple.com/ng/playlist/") ? true : false
        const url = contains_apple_playlist_url ? body.message.text : null

        switch (true) {
            case prompt_req === '/clear':
                //clear chat history
                context.log('Clearing chat history');
                await cosmo_surfer.deleteChatHistory(chatId, database, container);
                await bot.sendMessage(chatId, help_text.clear_history);
                return {
                    status: 200,
                    message: help_text.clear_history,
                };
            case prompt_req === '/start':
                //start conversation
                await bot.sendMessage(
                    chatId,
                    help_text.start,
                );
                return {
                    status: 200,
                    message: 'Conversation started',
                };
            case prompt_req === '/help':
                //help message
                await bot.sendMessage(
                    chatId,
                    help_text.help,
                );
                return {
                    status: 200,
                    message: 'Help message sent',
                };
            case contains_apple_playlist_url:
                //convert playlist
                await bot.sendMessage(chatId, "I'm working on it, please give me a minute or two 🤖.");
                const converted_playlist = await spotify_helper.convertAppleMusicPlaylist(url, context);
                await bot.sendMessage(chatId, 'Still working on it , my creator is still working on making me faster 🤖. In the meantime, take me as I am 🤗.');
                const retrieve_access_token = await spotify_helper.refreshAccessToken(process.env.REFRESH_TOKEN);
                const retrieve_spotify_IDs = await spotify_helper.searchSongs(converted_playlist.tracks, retrieve_access_token, context)
                await bot.sendMessage(chatId, 'Almost done..., I promise 🤞.');

                if (retrieve_spotify_IDs) {
                    const spotify_user_id = process.env.SPOTIFY_USER_ID;
                    const username = body.message?.from?.first_name;
                    const add_track = await spotify_helper.addSongsToPlaylist(
                        spotify_user_id,
                        username,
                        retrieve_spotify_IDs,
                        retrieve_access_token,
                        context,
                        converted_playlist
                    ).catch(async (err) => {
                        context.log('Error creating Playlist', err);
                        await bot.sendMessage(chatId, "I'm sorry, I was 👌🏻 close to creating your playlist 😢. Please try again in a minute while I gather my thoughts.");
                    });;
                    await bot.sendMessage(chatId, `Here's your converted playlist 🤖, as promised : ${add_track}.`);
                    await bot.sendMessage(chatId, ' If you do not have a Spotify account, you can visit https://soundiiz.com/ to convert the playlist to other preferred music service.');
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
                    }
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
                let imageUrls = imageResponse.data.data || [];
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
                    temperature: 0.5,
                    messages: [{ role: 'user', content: playlistMessage }],
                }).catch(async (err) => {
                    context.log('Error getting response from OpenAi', err);
                    await bot.sendMessage(chatId, "I'm sorry, I ruined your playlist 😢. Please try again in a minute while I gather my thoughts 😿.");
                });
                await bot.sendMessage(chatId, 'Still working on it , my creator is still working on making me faster 🤖. In the meantime,  take me as I am 🤗.');
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
                    }
                };
            case prompt_req.includes('/resume') && contains_id:

                try {
                    const fileIds = prompt_req_doc.match(regex);
                    const uniqueId = fileIds[0] || prompt_req_doc.split(" ")[1]

                    if (!uniqueId) {
                        await bot.sendMessage(chatId, "Document ID not provided or in wrong format, please check and retry. Ypu can refer to \help ")
                        return {
                            status: 400,
                            body: "Invalid document id provided.",
                        }
                    }
                    const prompt = prompt_req.replace(uniqueId.toLowerCase(), '').replace("\\", '').replace('/resume', '')
                    const file = await cosmo_surfer.findDocument(uniqueId, 'ChatDB', 'fileContainer', context)

                    await bot.sendMessage(body.message.chat.id, "I'm on it!");
                    const extracted_text = await document_processing.retrieve_document(context, body, bot, true, uniqueId, file.document)
                    const fileName = extracted_text.fileName;
                    const chatId = extracted_text.chatId;
                    const openai_prompt = await document_processing.openai_prompt(context, extracted_text.text_input, bot, true, chatId, prompt)
                    let resume = `${openai_prompt.data.choices[0].message.content}`;
                    resume = resume.replace(/""/g, "");
                    const pdf = await document_processing.create_pdf(context, resume, bot, chatId)
                    const upload_to_blob = await document_processing.upload_to_blob(context, pdf, fileName, bot, chatId)
                    await bot.sendMessage(chatId, `Here's your request! : ${upload_to_blob}`);
                    await bot.sendMessage(chatId, `Hope it helps!`);
                    return {
                        status: 200,
                        body: "Resume received, and processed.",
                    };
                } catch (error) {
                    context.error("Error occurred:", error);
                    return {
                        status: 500,
                        body: `Document received, but An internal error occurred while processing the request. ${error}`,
                    };
                }
            case prompt_req.includes('/document') && contains_id:
                context.log('Document received');

                try {
                    const fileIds = prompt_req_doc.match(regex);
                    const uniqueId = fileIds[0] || prompt_req_doc.split(" ")[1]

                    if (!uniqueId) {
                        await bot.sendMessage(chatId, "Document ID not provided or in wrong format, please check and retry. Ypu can refer to \help ")
                        return {
                            status: 400,
                            body: "Invalid document id provided.",
                        }
                    }
                    const prompt = prompt_req.replace(uniqueId.toLowerCase(), '').replace("\\", '').replace('/document', '')
                    const file = await cosmo_surfer.findDocument(uniqueId, 'ChatDB', 'fileContainer', context)

                    await bot.sendMessage(body.message.chat.id, "I'm on it!");
                    const extracted_text = await document_processing.retrieve_document(context, body, bot, false, uniqueId, file.document)
                    const fileName = extracted_text.fileName;
                    const chatId = extracted_text.chatId;
                    const openai_prompt = await document_processing.openai_prompt(context, extracted_text.text_input, bot, false, chatId, prompt)
                    let document = `${openai_prompt.data.choices[0].message.content}`;
                    document = document.replace(/""/g, "");
                    const pdf = await document_processing.create_pdf(context, document, bot, chatId)
                    const upload_to_blob = await document_processing.upload_to_blob(context, pdf, fileName, bot, chatId)
                    await bot.sendMessage(chatId, `Here's your  document! : ${upload_to_blob}`);
                    await bot.sendMessage(chatId, `Hope it helps!`);
                    return {
                        status: 200,
                        body: "Resume received, and processed.",
                    };
                } catch (error) {
                    context.error("Error occurred:", error);
                    return {
                        status: 500,
                        body: `Document received, but An internal error occurred while processing the request. ${error}`,
                    };
                }

            default:
                const history = messages;
                if (messages?.length > 7) messages.shift();

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
                let response = await openAI_API.post('/chat/completions', {
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
        console.log(error);
        context.error(`Error when processing request: ${error}`);
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
