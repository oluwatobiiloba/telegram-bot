const { app } = require("@azure/functions") 
const querystring = require('querystring');
const crypto = require('crypto');
const axios = require('axios');
const {spotify_login, spotify_callback} = require("../oauth-handlers")


app.http("spotify", {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: (request, context) => spotify_login(request,context),
})

app.http("spotify-callback", {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (req, context) => spotify_callback(req,context),
})