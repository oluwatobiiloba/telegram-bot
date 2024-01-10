const { promptMsgs, logMsgs } = require('../messages');

module.exports = {
    generatePrompt: ({userInput, module, prevContext}) => {
        let messages = [];
        switch (module) {
            case "playlist-generator":
                messages.push(
                    {
                        role: 'system',
                        content: promptMsgs.CREATE_CLOUDFARE_PLAYLIST
                    },
                    {
                        role: 'user',
                        content: promptMsgs.CREATE_CLOUDFARE_PLAYLIST_INSTRUCTION + userInput
                    }
                )
                return messages;
            case "playlist-addition-generator":
                messages.push(
                    {
                        role: 'system',
                        content: promptMsgs.CREATE_CLOUDFARE_PLAYLIST
                    },
                    {
                        role: 'user',
                        content: promptMsgs.CREATE_CLOUDFARE_PLAYLIST_ADDITION(prevContext, userInput)
                    }
                )
                return messages;
            case "image-generator":
                return userInput;
            case "optimize-document":
                messages.push(
                    {
                        role: 'system',
                        content: promptMsgs.INIT_DOC_OPTIMIZE
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                )
                return messages;
            case "resume-optimizer":
                messages.push(
                    {
                        role: 'system',
                        content: promptMsgs.INIT_RESUME_OPTIMIZE
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                )
                return messages
            case "cover-letter-generator":
                messages.push(
                    {
                        role: 'system',
                        content: promptMsgs.INIT_COVER_LETTER_GENERATOR
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                )
            default:
                messages.push(
                    {
                        role: 'system',
                        content: promptMsgs.INIT
                    }
                )
                if (Array.isArray(userInput)) {
                    messages = messages.concat(userInput)
                }
                return messages

        }
    }
}