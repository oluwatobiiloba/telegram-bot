const querystring = require('querystring');
const crypto = require('crypto');
const { SCOPES, CLIENT_ID, REDIRECT_URI, ENCRYPTION_KEY } = process.env
const authDao = require('../daos/auth');
const encrytion = require('../utils/encryption');
const jwt = require('jsonwebtoken');

module.exports = async function(req,context) {
    const chat_id = req.query.get('chat_id') || null;

    if (!chat_id) {
        return {
            status: 400,
            body: "No chat ID provided"
        }
    }

try {
        await authDao.createAuth(chat_id)
        
        const encryptedID = encrytion.encryptRefreshToken(chat_id)
        const token = jwt.sign( encryptedID, ENCRYPTION_KEY)
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
    console.log(error)
    return {
        status: 500,
        body: `An internal errror occured`
    }
}
}