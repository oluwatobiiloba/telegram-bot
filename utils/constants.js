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
};
