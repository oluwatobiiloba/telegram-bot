const querystring = require('querystring');
const { SCOPES, CLIENT_ID, REDIRECT_URI, ENCRYPTION_KEY } = process.env
const authDao = require('../daos/auth');
const encrytion = require('../utils/encryption');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const TimeLogger = require('../utils/timelogger');

module.exports = async function (req, context) {
    const timeLogger = new TimeLogger(`SPOTIFY-LOGIN-DURATION-${Date.now()}`);
    const chat_id = req.query.get('chat_id') || null;

    if (!chat_id) {
        return {
            status: 400,
            body: "Your Chat ID is required"
        }
    }

    try {
        logger.info(`Creating auth for ${chat_id}`, 'spotify-login')

        await authDao.createAuth(chat_id)

        timeLogger.start('encrypt-user-id')

        const encryptedID = encrytion.encryptRefreshToken(chat_id)
        const token = jwt.sign(encryptedID, ENCRYPTION_KEY)

        timeLogger.end('encrypt-user-id')

        const authEndpoint = 'https://accounts.spotify.com/authorize';
        const params = querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPES,
            redirect_uri: REDIRECT_URI,
            state: token
        });
    
        const authUrl = `${authEndpoint}?${params}`;
        return {
            status: 302,
            headers: {
              Location: authUrl
            }
          };
    } catch (error) {
        logger.error(`Error creating auth for ${chat_id} : ${error.message}`, 'spotify-login')
        return {
            status: 500,
            body: `An internal errror occured`
        }
}
}