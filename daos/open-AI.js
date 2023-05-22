const axios = require('axios');
const { promptMsgs, logMsgs } = require('../messages');
const { OPEN_AI_CHAT_URL, OPEN_AI_IMG_URL } = require('../utils/constants');
const {APIError} = require('../utils/error-handler');

const openAI = axios.create({
  baseURL: process.env.OPEN_AI_URL,
  headers: { Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}` },
});

module.exports = {
  optimizeDocument(text, prompt, isResume) {
    let apiPrompt = prompt;

    try {
      if (!apiPrompt) {
        apiPrompt = isResume ? promptMsgs.DEFAULT_RESUME_PROMPT : promptMsgs.DEFAULT_DOC_PROMPT;
      }

      apiPrompt = `${apiPrompt} ${promptMsgs.API_INSTRUCTION} ${text}`;
      apiPrompt = apiPrompt
        .replace(/[^\x00-\x7F]/g, '-')
        .replace(/[\u2022-\u2027\u25AA-\u25FF]/g, '-');

      return this.prompt(apiPrompt, true);
    } catch (err) {
      throw APIError(err);
    }
  },

  async prompt(content, noTemp) {
    const payload = {
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      messages: [{ role: 'user', content }],
    };

    if (Array.isArray(content)) {
      payload.messages = content;
    }

    if (noTemp) {
      delete payload.temperature;
    }

    try {
      const response = await openAI.post(OPEN_AI_CHAT_URL, payload);

      return response.data.choices;
    } catch (err) {
      throw APIError(err);
    }
  },

  async generateImages(data) {
    try {
      const response = await openAI.post(OPEN_AI_IMG_URL, data);

      return response.data.data;
    } catch (err) {
      throw APIError(err);
    }
  },
};
