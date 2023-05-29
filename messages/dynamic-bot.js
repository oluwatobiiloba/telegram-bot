module.exports = {
  getJobInProgress: (jobId) =>
    `I'll get back to you shortly, I've got workers working on your request. Here's your ticket ID: ${jobId}`,
  getJobComplete: (blob) => `Here's your request! : ${blob}`,
  getDocUpdate: (isResume) => `I'm reading your ${isResume ? 'resume' : 'document'}!🤖🤖`,
  getDocReceived: (
    fileId
  ) => `PDF File received. Your file_id is ${fileId}. To process your file, kindly reply in the following format. 
    
  /resume <file_id> <what you want Maya to do>

  Example:
  /resume BQACAgQAAxkBA I want to apply for a junior designer role ....`,
  getPlaylistGenerated: (url) => `Here's your playlist 🤖, as promised : ${url}.`,
  getSpotifyAuth: (id) =>
    `You do not have a spotify account linked to your telegram account. Kindly use this link to link your account: ${process.env.WEBHOOK_URL}/api/spotify?i=${id}`,
};
