# Maya - An AI Chatbot with Telegram Integration

Maya is an intelligent chatbot utilizing the power of OpenAI's GPT-3, Dall-E, and 3.5-turbo models to generate human-like responses and images to user queries. The app is hosted on Azure Functions and stores chat history on Cosmos DB.

This implementation is an improvement on the original version by @timilehinshodiya that integrates Maya with Telegram bot API. The bot responds to prompts received from users on Telegram with generated responses and images.

## Installation and Setup

1. Clone the repository by running `git clone <repository-url>` in your terminal.
2. Install the required dependencies by running `npm install` in the root directory.
3. Create a `.env` file with the following environment variables:
   - `OPEN_AI_TOKEN`: Your OpenAI authentication token
   - `OPEN_AI_URL`: The URL of the OpenAI API endpoint
   - `BOT_WEBHOOK`: The function app URL for receiving prompts from the telegram bot
   - `BOT_TOKEN`: The access token for your telegram bot provided by BotFather
4. Deploy the app to Azure Functions by running `func azure functionapp publish <function-app-name>`

## Usage

Maya responds to text-based messages from users on Telegram. To initiate a conversation, add the [Telegram bot](https://t.me/Maya_assist_bot) and send a message containing "/start". You can ask Maya a variety of questions or give her prompts to generate images. For example, you can say "create an image of a mountain range" and Maya will use Dall-E to generate two images based on the prompt received and return them back to you.

Maya stores chat history for each user in Cosmos DB, which allows it to have context for previous conversations with the user. This context helps Maya generate more accurate and relevant responses to the user's inquiries.

Additionally, there are other commands you can use to interact with the chatbot such as /help to get help information or /clear to clear the chat history for the current chat session.

## Technologies Used

Maya is built with the following technologies:

- Node.js - JavaScript runtime environment
- Azure Functions - Serverless compute service
- Cosmos DB - A multi-model database service provided by Microsoft that provides scalable, low-latency access to NoSQL data.
- OpenAI - An artificial intelligence research lab that offers a variety of natural language processing (NLP) and machine learning (ML) models.
- Telegram - A messaging API that allows developers to interact with the Telegram platform and build chatbots.

## Conclusion

Maya is an efficient chatbot that utilizes advanced NLP and ML model to generate accurate and relevant responses to user queries. It is hosted on Azure Functions, which enables optimal performance and scalability. With the ability to store chat history on Cosmos DB, Maya is able to provide context for previous conversations with users resulting in a more human-like experience for the end-user. The integration with Telegram bot API makes it even more accessible to users.
