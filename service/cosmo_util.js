// Load the CosmosClient module from the @azure/cosmos package
const { CosmosClient } = require('@azure/cosmos');

// Extract endpoint and key values from the environment variables
const { endpoint, key, database, container } = {
    endpoint: process.env.COSMO_ENDPOINT,
    key: process.env.COSMO_KEY
};

// Creates options object with endpoint, key, and user agent suffix settings
const options = {
    endpoint,
    key,
    userAgentSuffix: 'Azure Function App'
};

// Connect to CosmosDB using CosmosClient object and options object
const client = new CosmosClient(options);

module.exports = {
    // A function to retrieve chat history given a chat id
    async getChatHistory(chatId, database, container) {
        try {
            const { resource } = await client.database(database).container(container).item(chatId.toString(), chatId.toString()).read();
            if (!resource) {
                await client.database(database).container(container).items.create({
                    id: chatId.toString(),
                    partitionKey: chatId.toString(),
                    chatHistory: []
                });
            }
            const chatHistory = resource || { chatHistory: [] };
            const messages = chatHistory.chatHistory ?? [];

            return messages;
        } catch (error) {
            console.log(error);
        }
    },

    // A function to update chat history given a chat id and a new message 
    async updateChatHistory(chatId, messages, database, container) {
        try {
            await client.database(database).container(container).item(chatId.toString(), chatId.toString()).replace({
                id: chatId.toString(),
                partitionKey: chatId.toString(),
                chatHistory: messages
            });
        } catch (error) {
            console.log(error);
        }
    },

    // A function to create chat history given a chat id
    async createChatHistory(chatId, database, container) {
        try {
            await client.database(database).container(container).items.create({
                id: chatId.toString(),
                partitionKey: chatId.toString(),
                chatHistory: []
            });
        } catch (error) {
            console.log(error);
        }
    },

    // A function to delete chat history given a chat id
    async deleteChatHistory(chatId, database, container) {
        try {
            await client.database(database).container(container).item(chatId.toString(), chatId.toString()).delete();
        } catch (error) {
            console.log(error);
        }
    },

    // A function to retrieve chat messages made by a specific user given a chat id and user id
    async getChatHistoryByUser(chatId, userId, database, container) {
        try {
            const { resource } = await client.database(database).container(container).item(chatId.toString(), chatId.toString()).read();
            if (!resource) {
                await client.database(database.id).container(container.id).items.create({
                    id: chatId.toString(),
                    partitionKey: chatId.toString(),
                    chatHistory: []
                });
            }
            const chatHistory = resource || { chatHistory: [] };
            const messages = chatHistory.chatHistory ?? [];
            const userMessages = messages.filter(message => message.role === 'user' && message.userId === userId);

            return userMessages;
        } catch (error) {
            console.log(error);
        }
    }
}
