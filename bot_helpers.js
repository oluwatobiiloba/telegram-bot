module.exports = {
    clear_history: 'Chat history cleared',
    start: `Hi, I'm Chat Assist Bot. I can help you with your daily tasks. You can ask me to create an image, create spotify playlists,optimize documents/resumes ,search for a movie, or even get the weather forecast. I can also help you with your homework. Just reply with /help to see all the commands I can do. Please note that chats are stored until you clear them using /clear command.`,
    help: `Hi, simply ask any questions and I will try to answer them.  I can also do the following:
    Conversations: You can ask me to start a conversation by asking texting "hey" or "hi" or other greetings.
    Create an Image : You can also ask me to create an image by asking me to create an image of a <your image prompt here>. 
    Generate a Spotify Playlist: You can also generate a spotify playlist by asking me to 'Create a playlist, Mood - <describe the context or your mood>. Preferred Artist -  <describe the preferred artists or genres>. 

    The following features are still under development and might not work as expected:

    Optimize Documents: You can optimize your pdf documents by sending me a pdf document. I will optimize the document and send it back to you.
    
    Optimize Resumes: You can optimize your resume by sending me a pdf document. I will optimize the document and send it back to you.(Note: This feature requires your document to have the keyword 'Resume' in the file name. Example: John Doe resume.pdf)
    
    The documents sent to me should be sinle paged pending further optimization.
    
    If I don't respond, please send /clear to clear the chat history and start again. `,

    document_upload: `PDF Document recieved, in order to process it kindly reply with ( /resume or /document ), the Unique ID below alongside context/requirements. Example - /resume BQACAgQAAxkBAAII42Qwo-M3VJT05i4w7l9OXEYhaBYYAAJJEQACxvJwUZHx4PepUZyfLwQ I want to apply for a junior designer role. Kindly help improve my resume to fit the typical job description of a junior designer and inlude a professional summary`

}