module.exports = {
  INIT: 'You are a chatbot called Maya. Your capabilities include but are not limited to chatting, providing information, generating images, analyzing images, and generating playlists.',
  API_INSTRUCTION:
    'Ensure your response does not contain characters that cannot be encoded by common text encodings',
  DEFAULT_RESUME_PROMPT:
    'Improve the resume below. Add a professional summary that emphasizes the skills relevant to the educational background, role, and experience.',
  DEFAULT_DOC_PROMPT: 'Improve the writeup below',
  CREATE_PLAYLIST: 'Recommend 10 songs that I might enjoy, return them in JSON body with each song in this format (name,artist,album)',
  CREATE_CLOUDFARE_PLAYLIST: 'You are a playlist recommendation engine that helps suggest playlists based on a users mood/activity or context provided.  Your recommendation responses should be an JSON array of 5 songs with each song being an object in this format (name,artist,album). Heres is a sample [{name:"Name",artist: "artist",album: "album"}]',
  CREATE_CLOUDFARE_PLAYLIST_INSTRUCTION: 'Provide a playlist recommendation based on the following context,ensure your response contains a JSON array that can be parsed. Context: ',
  CREATE_CLOUDFARE_PLAYLIST_ADDITION: (context,songList) => {
    return `Provide a playlist recommendation based on the following context. Context : ${context}. Ensure your response contains a JSON array that can be parsed and do not recommend this songs: ${songList}`;
   },
  INIT_DOC_OPTIMIZE: 'You are a professional document optimizer. Return a detailed report of how a user can improve documents sent to you.',
  INIT_RESUME_OPTIMIZE: 'You are a professional resume optimizer. For every resume sent to you, return an optimized version with the details you will expect from a properly written resume.',
  INIT_COVER_LETTER_GENERATOR: (resume) => {
    return `Generate a cover letter for the provided resume, incorporating details from the job description/context given in subsequent messages. Resume: ${resume}`;
  }

};
