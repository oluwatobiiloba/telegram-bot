const axios = require('axios');
const qs = require('qs');

const refreshAccessToken = (refreshToken) => {
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        },
        json: true
    };

    return axios.post(authOptions.url, qs.stringify(authOptions.form), {
        headers: authOptions.headers
    })
        .then((response) => {
            const { access_token } = response.data;
            return access_token;
        })
        .catch((error) => {
            console.error('Failed to refresh access token', error);
        });
};

const searchSongs = async (songs, access_token, context) => {
    try {
        const songPromises = songs.map(async (song) => {
            const searchQuery = encodeURIComponent(`${song.name} ${song.artist} ${song.album}`);
            const searchUrl = `https://api.spotify.com/v1/search?q=${searchQuery}&type=track`;

            const { data } = await axios.get(searchUrl, {
                headers: { Authorization: `Bearer ${access_token}` },
                params: { limit: 1 }
            });

            if (data.tracks.items.length > 0) {
              return data.tracks.items[0].id;
          } else {
              context.log(`Cannot find ID for ${song.name}`);
              return null;
          }
        });

        const songIds = await Promise.all(songPromises);
        return songIds.filter(id => id); // remove any null items
    } catch (error) {
        context.error(`Failed to search songs: ${error}`);
        throw error; // rethrow the error so it can be caught higher up
    }
};

const addSongsToPlaylist = async (
    spotify_user_id,
    username,
    spotify_IDs,
    access_token,
    context
) => {
    try {
        const playlist = await axios.post(
            `https://api.spotify.com/v1/users/${spotify_user_id}/playlists`,
            {
                name: `${username}'s Playlist by Maya`,
                description: "Playlist created by Chat Assist Bot",
                public: true
            },
            {
            headers: {
                  Authorization: `Bearer ${access_token}`
            }
            }
        );
        const playlist_id = playlist.data.id;
        const playlist_url = playlist.data.external_urls.spotify;
        const songs_uri = spotify_IDs.map((id) => `spotify:track:${id}`);
        await axios.post(
            `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
            {
                uris: songs_uri
            },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        );
        return playlist_url;
    } catch (error) {
        context.error(`Failed to add songs to playlist: ${error}`);
        throw error; // rethrow the error so it can be caught higher up
    }
};

module.exports = { refreshAccessToken, searchSongs, addSongsToPlaylist };
