const querystring = require('querystring');
const axios = require('axios');
const encrytion = require('../utils/encryption');
const authDao = require("../daos/auth");
const jwt = require('jsonwebtoken');
const azureQueue = require('../queue-workers/azure-queue-worker/queue');
const logger = require('../utils/logger');
const TimeLogger = require('../utils/timelogger');


const {  CLIENT_ID, CLIENT_SECRET, REDIRECT_URI , ENCRYPTION_KEY } = process.env

module.exports = async function (req, context) {

    const timeLogger = new TimeLogger(`SPOTIFY-CALLBACK-DURATION-${Date.now()}`);

    const code = req.query.get('code') || null;
    const state = req.query.get('state') || null;
    const error = req.query.get('error') || null;


    if (error) {
        console.error(`Authorization error: ${error}`);
        return {
            status: 400,
            body: `Authorization error: ${error}`
          }
    }
    if (!code || !state) {
        return {
            status: 400,
            messabodyge: `Missing authorization code or state parameter`
        };
    }

    logger.info(`Retrieving access token for spotify`, 'spotify-callback')
    try {
        timeLogger.start('decrypt-user-id')
        const { iv, encryptedToken } = jwt.verify(state, ENCRYPTION_KEY)

        const retrieved_id = encrytion.decryptRefreshToken(encryptedToken, iv) 

        timeLogger.end('decrypt-user-id')
        
        if (!retrieved_id) return {
            status: 400,
            body: `Invalid User ID`
        }
        const checkUser = await authDao.checkUser(retrieved_id)
        
    
        if (!checkUser.exists) return {
            status: 400,
            body: `User does not exist.`
        }
        
        const tokenEndpoint = 'https://accounts.spotify.com/api/token';
        const tokenParams = querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        });
        const tokenConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
            }
        };

        timeLogger.start('retrieve-access-token')
        const tokenRes = await axios.post(tokenEndpoint, tokenParams, tokenConfig);

        const hashedToken = encrytion.encryptRefreshToken(tokenRes.data.access_token)
        const hashedRefreshToken = encrytion.encryptRefreshToken(tokenRes.data.refresh_token)

        timeLogger.end('retrieve-access-token')
        
        const auth = {
            spotify: {
                hashedToken,
                hashedRefreshToken
            }
        }

        await authDao.updateAuth(retrieved_id, auth)

        timeLogger.start('process-suspended-playlist-generation')

        if (checkUser.resource.suspendedJob) {
            let data = {
                body: checkUser.resource.suspendedJob.body,
                botToken: checkUser.resource.suspendedJob.bot.token

            }

            data.body.chatId = checkUser.resource.suspendedJob.chatId
           await azureQueue.sendMessage("process-suspended-playlist-generation", data)
        }

        timeLogger.end('process-suspended-playlist-generation')

        return {
            status: 200,
            body: 'Authorization successful!'
          };
    } catch (err) {
        //console.error(`Failed to retrieve access token: ${err.message}`);
        logger.error(`Failed to retrieve access token: ${err.message}`, 'spotify-callback')
       return {
            status: 400,
            body: 'Authorization failed.'
          };
    }
}