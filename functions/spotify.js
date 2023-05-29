const { app } = require('@azure/functions');
const spotifyAuth = require('../services/functions/spotify-auth');
const spotifyAuthCallback = require('../services/functions/spotify-auth-callback');

app.http('spotify', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: (request) => spotifyAuth(request),
});

app.http('spotify-callback', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request) => spotifyAuthCallback(request),
});
