module.exports = {
  DOC_REGEX: /^\/(?:resume|document) [a-z0-9]{32}/g,
  APPLE_REGEX: /^https:\/\/music\.apple\.com\/\S+/gi,
  YOUTUBE_REGEX: /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|watch\?feature=player_embedded&v=|watch\?feature=player_embedded&v=|user\/\S+\/|playlist\?list=)?([\w-]+)(?:\S*)?/,
  CHATBOX_QUEUE_NAME: 'chatbox',
  JOB_PROCESS_DOC: 'process-document',
  NO_DB_RESOURCE_FOUND: 'No resource found!',
  OPEN_AI_IMG_URL: '/images/generations',
  OPEN_AI_CHAT_URL: '/chat/completions',
  IMG_SIZE: '1024x1024',
  CLOUDFARE_CONFIG: {
    URL:  ({model,CF_ACCOUNT_ID}) => {
      return `/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
    },
    MODELS: {
      IMAGE_CLASSIFICATION: '@cf/microsoft/resnet-50',
      IMAGE_GENERATION: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      CHAT: '@cf/meta/llama-2-7b-chat-int8',
      SPEECH_TO_TEXT: "@cf/openai/whisper"
    }
  }
};
