const axios = require('axios');
const qs = require('qs');
const { JSDOM } = require('jsdom');

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
    context,
    playlist_info
) => {
    try {
        const playlist = await axios.post(
            `https://api.spotify.com/v1/users/${spotify_user_id}/playlists`,
            {
                name: playlist_info ? `${playlist_info.name} (converted by Maya)` : `${username}'s Playlist by Maya`,
                description: playlist_info ? `Playlist by ${playlist_info.author}` : "Playlist created by Chat Assist Bot",
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

        if (playlist_info.image) {

            const image_data = await axios.get(playlist_info.image, {
                responseType: 'arraybuffer'
            });
            const image = Buffer.from(image_data.data, 'binary').toString('base64');
        
            await axios.put(
                `https://api.spotify.com/v1/playlists/${playlist_id}/images`,
                image,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                }
            );
        }
        return playlist_url;
    } catch (error) {
        context.error(`Failed to add songs to playlist: ${error}`);
        throw error; // rethrow the error so it can be caught higher up
    }
};

const convertAppleMusicPlaylist = async (playlist_url, context) => {
    try {
        const playlist_html = await axios.get(playlist_url);
        const html = playlist_html.data;
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const scriptTag = document.querySelector("script[id='schema:music-playlist']");
        const imageTag = document.querySelector("meta[property='og:image']");
        const image = imageTag?.getAttribute("content");
        const jsonContent = scriptTag.textContent;
        const playlist = JSON.parse(jsonContent);
        const track_info = playlist.track.map(async (track) => { 
            if (track.url === undefined) {
                return null;
            }

            const { data } = await axios.get(track.url);
            const track_dom = new JSDOM(data);
            const track_document = track_dom.window.document;
            const track_scriptTag = track_document.querySelector("meta[property='music:musician']");
            const album_scriptTag = track_document.querySelector("meta[property='og:url']");
            const track_tag_content = track_scriptTag?.getAttribute("content");
            const album_tag_content = album_scriptTag?.getAttribute("content");
            const artist = track_tag_content?.split("/").slice(-2, -1)[0];
            const album = album_tag_content?.split("/").slice(-2, -1)[0];

            if ( artist || album ) {
                return {
                    name: track.name,
                    artist: artist,
                    album: album
              }
          } else {
             // context.log(`Cannot find ID for ${song.name}`);
              return null;
          }
        });
        const playlist_object = {
            name: playlist.name,
            description: playlist.description,
            author: playlist.author.name,
            image: image,
            tracks: await Promise.all(track_info)
        }
        return playlist_object;
    } catch (error) {
        context.error(`Failed to convert Apple Music playlist: ${error}`);
        throw error; // rethrow the error so it can be caught higher up
    }
}



module.exports = { refreshAccessToken, searchSongs, addSongsToPlaylist,convertAppleMusicPlaylist };
