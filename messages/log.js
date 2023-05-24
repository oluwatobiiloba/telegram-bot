module.exports = {
  JOB_QUEUED: 'Job added to queue',
  INVALID_JOB_ID: 'Invalid document id provided.',
  INTERNAL_ERROR: 'Document received, but an internal error occurred while processing the request.',
  RESUME_PROCESSED: 'Resume received and processed.',
  REMOVED_FROM_GROUP: 'User kicked me out of the group',
  CANT_PROCESS_VIDEO_NOTES:
    'Video note received, but video notes cannot be processed at the moment',
  INVALID_FILE_FORMAT: 'Invalid file format received',
  API_REQ_ERROR: 'Error Fetching Data From Network',
  NO_PLAYLIST_GENERATED: 'No songs recommended.',
  PROMPT_REPLY_SENT: 'Message Sent',
  IMG_GENERATED: 'Image Generated',
  PLAYLIST_GENERATED: 'Playlist Created',
  NO_SONG_IDS: 'No Song Id was returned',
  ERROR_PARSING_HTML: 'Could not parse HTML document',
  NO_HTML_CONTENT: 'Could not get content from HTML document',
  NO_PLAYLIST_TRACK_INFO: 'Could not get playlist track information',
  NO_SPOTIFY_USER_ID: 'Spotify Id is required to generate playlist',
  NO_CHAT_ID: 'Could not get ChatID',
  NO_AI_RESPONSE: 'No response gotten from AI',
  NO_DOCUMENT_FOUND: 'Could not get file document',
  getFileUploadSuccess: (fileId) => `File Upload Successful. Id: ${fileId}`,
  getConvoStarted: (chatId) => `Conversation started with id - ${chatId}`,
  getHelpMessageSent: (chatId) => `Help message sent to id - ${chatId}`,
  getImageGenFailed: (chatId) => `Could not generate images for id - ${chatId}`,
};
