const { APPLE_REGEX, YOUTUBE_REGEX } = require('./constants');

const requestHandlerMapper = {
  'create an image': 'generate-image',
  'create a playlist': 'create-playlist',
};

module.exports = (prompt) => {
  let handler = 'default';

  if (APPLE_REGEX.test(prompt)) {
    handler = 'convert-apple-playlist';
  } else if (YOUTUBE_REGEX.test(prompt?.substring(0, 50))) {
    handler = 'convert-download-youtube-video'
  } else {
    const lowerPrompt = prompt.toLowerCase();
    for (let key of Object.keys(requestHandlerMapper)) {
      if (lowerPrompt.includes(key)) {
        handler = requestHandlerMapper[key];
        break;
      }
    }
  }

  return handler;
};
