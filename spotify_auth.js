const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');

const state = crypto.randomBytes(20).toString('hex');

const app = express();
const PORT = 8888;
const CLIENT_ID = '482a639505514022863440361d2abaac';
const CLIENT_SECRET = '604af0e299af411cbdc797c8d94dcdd7';
const REDIRECT_URI = 'http://localhost:8888/callback';
const STATE = state;
const SCOPES = 'playlist-modify-public playlist-modify-private';

// Step 1: Redirect the user to the Spotify authorization page
app.get('/login', (req, res) => {
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const params = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        state: STATE
    });
    const authUrl = `${authEndpoint}?${params}`;
    res.redirect(authUrl);
});

// Step 2: Handle the authorization code and exchange it for an access token
app.get('/callback', async (req, res) => {
    console.log('Callback', req.query);
    const code = req.query.code || null;
    const state = req.query.state || null;
    const error = req.query.error || null;
    if (error) {
        console.error(`Authorization error: ${error}`);
        res.status(400).send(`Authorization error: ${error}`);
        return;
    }
    if (!code || !state) {
        res.status(400).send('Missing authorization code or state parameter');
        return;
    }
    if (state !== STATE) {
        res.status(400).send('State parameter does not match');
        return;
    }

    try {
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
        const tokenRes = await axios.post(tokenEndpoint, tokenParams, tokenConfig);
        console.log(tokenRes.data);
        const accessToken = tokenRes.data.access_token;
        console.log(`Access token: ${accessToken}`);
        res.send(`Access token: ${accessToken}`);
    } catch (err) {
        console.error(`Failed to retrieve access token: ${err.message}`);
        res.status(500).send(`Failed to retrieve access token: ${err.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
