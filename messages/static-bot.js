module.exports = {
  CLEAR_HISTORY: 'Chat history cleared',
  START_CHAT: `Hi, I'm Chat Assist Bot.\nI can help you with your daily tasks.\nYou can ask me to create an image, create spotify playlists,optimize documents/resumes ,search for a movie, or even get the weather forecast.I can also help you with your homework.\nJust reply with /help to see all the commands I can do.\nPlease note that chats are stored until you clear them using /clear command.`,
  HELP: `Hi, simply ask any questions and I will try to answer them.  I can also do the following:
    Conversations: You can ask me to start a conversation by asking texting "hey" or "hi" or other greetings.
    Create an Image : You can also ask me to create an image by asking me to create an image of a <your image prompt here>.
    Generate a Spotify Playlist: You can also generate a spotify playlist by asking me to 'Create a playlist, Mood - <describe the context or your mood>. Preferred Artist -  <describe the preferred artists or genres>.

    To link your spotify account, send /link-spotify to link your spotify account.

    The following features are still under development and might not work as expected:

    Optimize Documents: You can optimize your pdf documents by sending me a pdf document. I will optimize the document and send it back to you.

    Optimize Resumes: You can optimize your resume by sending me a pdf document. I will optimize the document and send it back to you.(Note: This feature requires your document to have the keyword 'Resume' in the file name. Example: John Doe resume.pdf)

    The documents sent to me should be sinle paged pending further optimization.

    If I don't respond, please send /clear to clear the chat history and start again. `,

  INVALID_JOB_ID:
    'Document ID not provided or in wrong format, please check and retry. You can refer to help',
  DOC_PROC_FINAL_MSG: 'Hope it helps!',
  ALMOST_DONE: "I'm almost done!🤖🤖",
  ALMOST_DONE_2: 'Almost done!, for real this time. 🤖🤖',
  CANT_PROCESS_VIDEO_NOTES: "I'm incapable of processing video notes.",
  CAN_ONLY_PROCESS_PDF: 'The file you sent seems exciting. Unfortunately, I only read PDF files 🙈',
  NO_PROMPT: 'I do not quite understand. Please could you rephrase your messages.',
  INTERNAL_ERROR:
    'Beeep!!! Booop!!! Ooops! I forgot what I was doing. Please can I rest a moment 🤖',
  GEN_PLAYLIST_SEQ: [
    "You'll have to give me a minute or more 🌝, I'll send your playlist once I'm done.",
    'Still working on it , my creator is still working on making me faster 🤖. In the meantime,  take me as I am 🤗.',
    'Almost done..., I promise 🤞.',
    'If you do not have a Spotify account, you can visit https://soundiiz.com/ to convert the playlist to your preferred music service.',
    'Playlist too short, getting additional songs for you 🤗.',
  ],
    DOWNLOAD_YOUTUBE_SEQ: [
      "You'll have to give me a minute or more 🌝, I'll send your video once I'm done.",
      "Fetching ",
      'Almost done..., I promise 🤞.',
  ],
  ERROR_GEN_PLAYLIST:
    "I'm sorry, I ruined your playlist 😢. Please try again in a minute while I gather my thoughts 😿.",
  RESTART_CHAT: "Apologies, I lost my messages 😿.\nPlease can you send /start or clear the chat history?\nThis will help me gather my thoughts",
  CALLBACK_AUTH_MSGS: [
    'Confirming Identity....',
    'Linking Account....',
    'Linking Successful... Gathering thoughts...'
  ],
  ERROR_CON_YOUTUBE_VIDEO: "Invalid youtube url",
  ERROR_CON_YOUTUBE_PLAYLIST: "Unable to complete the playlist conversion",
  ERROR_PLAYLIST_VIDEO_CONVERSION: "Unable to convert or download - ",
  CAN_ONLY_CONVERT_PLAYLISTS_WITH_MAXIMUM: "Unable to convert or download playlists with over 4 videos",
  SPOTIFY_ACCOUNT_ALREADY_LINKED: "You already have a spotify account linked to Maya. Kinldy send /clear-spotify to unlink the account",
  NO_USER_RECORD_FOUND: "Seems you have no linked spotify account",
  SPOTIFY_ACCOUNT_UNLINKED: "Successfully unlinked your spotify account"
};
