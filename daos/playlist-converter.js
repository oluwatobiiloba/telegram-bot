const { JSDOM } = require('jsdom');
const axios = require('axios');
const { logMsgs } = require('../../messages');

module.exports = {
  async appleToSpotify(appleUrl) {
    try {
      const { data } = await axios.get(appleUrl);
      const document = new JSDOM(data)?.window?.document;

      if (!document) throw new Error(logMsgs.ERROR_PARSING_HTML);

      const jsonContent = document.querySelector("script[id='schema:music-playlist']")?.textContent;

      if (!jsonContent) throw new Error(logMsgs.NO_HTML_CONTENT);

      const playlistContent = JSON.parse(jsonContent);

      const trackInfo = playlistContent.track?.map(async (track) => {
        if (track.url) {
          const { data } = await axios.get(track.url);
          const trackDocument = new JSDOM(data)?.window?.document;

          if (!trackDocument) throw new Error(logMsgs.ERROR_PARSING_HTML);

          const trackContent = trackDocument
            .querySelector("meta[property='music:musician']")
            ?.getAttribute('content');
          const albumContent = trackDocument
            .querySelector("meta[property='og:url']")
            ?.getAttribute('content');

          const artist = trackContent?.split('/').slice(-2, -1)[0];
          const album = albumContent?.split('/').slice(-2, -1)[0];

          if (artist || album) {
            return {
              name: track.name,
              artist,
              album,
            };
          }
        }
      });

      if (!trackInfo) throw new Error(logMsgs.NO_PLAYLIST_TRACK_INFO);

      let tracks = await Promise.all(trackInfo);
      tracks = tracks.filter(Boolean);

      const funcResponse = { playlistContent, tracks };

      const imageContent = document
        .querySelector("meta[property='og:image']")
        ?.getAttribute('content');

      let imageData;

      if (imageContent) {
        const { data } = await axios.get(imageContent, {
          responseType: 'arraybuffer',
        });

        imageData = Buffer.from(data.data, 'binary').toString('base64');
      }

      if (imageData) funcResponse.image = imageData;

      return funcResponse;
    } catch (err) {
      throw err;
    }
  },
};
