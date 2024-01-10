const axios = require('axios');
const { promptMsgs, logMsgs } = require('../messages');
const { CLOUDFARE_CONFIG } = require('../utils/constants');
const {APIError} = require('../utils/error-handler');
const { CF_ACCOUNT_ID, CLOUDFARE_AI_TOKEN } = process.env;
const cloudfareAI = axios.create({
  baseURL: process.env.CLOUDFARE_BASE_URL,
  headers: { Authorization: `Bearer ${CLOUDFARE_AI_TOKEN}` },
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

    async prompt(message, noTemp, model = CLOUDFARE_CONFIG.MODELS.CHAT ) {
      try {
        let payload;
        if (Array.isArray(message)) {
            payload = {
                messages: message
            }
        } else {
            payload = {
                prompt: message
            }
        }

        const URL = CLOUDFARE_CONFIG.URL({ CF_ACCOUNT_ID, model });
        const response = await cloudfareAI.post(URL, payload);
        return response.data;
      } catch (err) {
        throw APIError(err);
    }
  },

  async generateImages(data, model = CLOUDFARE_CONFIG.MODELS.IMAGE_GENERATION) {
      try {
        const payload = {
            prompt: data.prompt
        }
        const URL = CLOUDFARE_CONFIG.URL({ CF_ACCOUNT_ID, model });
        const response = await cloudfareAI.post(URL, payload, { responseType: 'arraybuffer' });

        return response.data;
    } catch (err) {
      throw APIError(err);
    }
  },
};
