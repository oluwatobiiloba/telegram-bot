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
        const songIds = [];

        for (let i = 0; i < songs.length; i++) {
            // encode search query for titles, albums, and artists with spaces
            const searchQuery = encodeURIComponent(`${songs[i].name} ${songs[i].artist} ${songs[i].album}`);
            const searchUrl = `https://api.spotify.com/v1/search?q=${searchQuery}&type=track`;

            const { data } = await axios.get(searchUrl, {
                headers: { Authorization: `Bearer ${access_token}` },
                params: { limit: 1 }
            });

            if (data.tracks.items.length > 0) {
                // add the first track's ID to the songIds array
                songIds.push(data.tracks.items[0].id);
            } else {
                // handle songs that cannot be found in Spotify
                context.log(`Cannot find ID for ${songs[i].name}`);
            }
        }
        return songIds;
    } catch (error) {
        context.error(`Failed to search songs: ${error}`);
    }
};

const addSongsToPlaylist = async (spotify_user_id, username, spotify_IDs, access_token, context) => {
    try {
        const playlist = await axios.post(`https://api.spotify.com/v1/users/${spotify_user_id}/playlists`, {
            name: `${username}'s Playlist by Maya`,
            description: "Playlist created by Chat Assist Bot",
            public: true
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            }
        })
        const playlist_id = playlist.data.id;
        const playlist_url = playlist.data.external_urls.spotify;
        const songs_uri = spotify_IDs.map(id => `spotify:track:${id}`);
        await axios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            "uris": songs_uri
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        }).catch(err => {
            context.log("Error", err)
        })
        return playlist_url
    } catch (error) {
        context.error(`Failed to add songs to playlist: ${error}`);
    }
}


module.exports = { refreshAccessToken, searchSongs, addSongsToPlaylist };
