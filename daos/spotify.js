const axios = require('axios');
const qs = require('qs');
const { logMsgs } = require('../messages');
const { APIError } = require('../utils/error-handler');
const logger = require('../utils/logger');
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

const BASE_URL = 'https://api.spotify.com/v1';
const ACCOUNT_BASE_URL = 'https://accounts.spotify.com/api/token';

async function _getSongIds(songList, accessToken) {
  try {
    const songPromises = songList.map(async (song) => {
      const searchQuery = encodeURIComponent(`${song.name} ${song.artist} ${song.album}`);

      const response = await axios({
        method: 'get',
        url: `${BASE_URL}/search?q=${searchQuery}&type=track`,
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 1 },
        transformResponse: [
          function (data) {
            const dataObj = JSON.parse(data);
            return dataObj.tracks?.items;
          },
        ],
        errorHandler: (err) => {
          throw err;
        },
      });

      const trackItems = response.data;
      //console.log(trackItems);
      if (trackItems?.length) return trackItems[0].id;
    });

    const songIds = await Promise.all(songPromises);

    return songIds.filter(Boolean);
  } catch (error) {
    throw APIError(error);
  }
}

function _setPlaylistImage(image, playlistID, accessToken) {
  return axios({
    method: 'put',
    url: `${BASE_URL}/playlists/${playlistID}/images`,
    data: image,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    },
  });
}

function _createPlaylist(userId, accessToken, config) {
  return axios({
    url: `${BASE_URL}/users/${userId}/playlists`,
    method: 'post',
    data: {
      ...config,
      public: true,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function _addTracksToPlaylist(id, songURIs, accessToken) {
  return axios({
    url: `${BASE_URL}/playlists/${id}/tracks`,
    method: 'post',
    data: {
      uris: songURIs,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function resolvePlaylistDetails(config) {
  const details = {
    name: 'Your Playlist by Maya',
    description: 'Playlist created by Maya',
  };

  if (config.name) {
    let name;

    name = config.name;

    if (config.isConverted) {
      name += ' (converted by Maya)';
    }

    details.name = name;
  } else if (config.user?.username) {
    details.name = config.user.username + "'s Playlist by Maya";
  }

  if (config.author) {
    details.description = details.description.replace('Maya', config.author);
  }

  return details;
}

module.exports = {
  async getAccessToken(token) {
    try {
      const authToken = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

      const headers = {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const form = {
        grant_type: 'refresh_token',
        refresh_token: token,
      };

      const response = await axios({
        url: ACCOUNT_BASE_URL,
        method: 'post',
        data: qs.stringify(form),
        headers,
        json: true,
      });

      return response.data.access_token;
    } catch (err) {
      throw APIError(err);
    }
  },

  async createPlaylist(songList, accessToken, config) {
    try {
      const userId = config?.user?.id;
      if (!userId) throw new Error(logMsgs.NO_SPOTIFY_USER_ID);

      const songIds = await _getSongIds(songList, accessToken);

      if (!songIds?.length) throw new Error(logMsgs.NO_SONG_IDS);

      const songURIs = [];

      songIds.forEach((id) => {
        if (id) songURIs.push(`spotify:track:${id}`);
      });

      const playlistConfig = resolvePlaylistDetails(config);

      const response = await _createPlaylist(userId, accessToken, playlistConfig);

      const playlistId = response.data.id;
      const playlistURL = response.data.external_urls.spotify;

      await _addTracksToPlaylist(playlistId, songURIs, accessToken);

      // This bit is not super important so if it fails not a major problem
      if (config.image) {
        try {
          await _setPlaylistImage(config.image, playlistId, accessToken);
        } catch (e) {
          e.message = `Failed to set playlist image - ${e.message}`;
          logger.error(e, 'SET-PLAYLIST-IMAGE-ERROR');
        }
      }

      return playlistURL;
    } catch (err) {
      throw APIError(err);
    }
  },

  async getUserProfile(accessToken) {
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      
      const response = await axios({
        url: `${BASE_URL}/me`,
        method: 'get',
        headers,
      });

      return response.data;
    } catch (error) {
      throw APIError(error);
    }
  },

  async getTokens(code) {
    try {
      const tokenParams = qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      });
      const tokenConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
      };

      const { data } = await axios.post(ACCOUNT_BASE_URL, tokenParams, tokenConfig);

      return { accessToken: data.access_token, refreshToken: data.refresh_token };
    } catch (err) {
      throw APIError(err);
    }
  },
};
