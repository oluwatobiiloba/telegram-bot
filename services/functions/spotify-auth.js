const qs = require('qs');
const { SCOPES, CLIENT_ID, REDIRECT_URI } = process.env;
const userDao = require('../../daos/user');
const logger = require('../../utils/logger');
const resUtil = require('../../utils/res-util');
const { logMsgs } = require('../../messages');

module.exports = async function (req) {
  const id = req.query.get('i');

  try {
    if (!id) throw new Error(logMsgs.ID_IS_REQUIRED);

    const user = await userDao.getUser(id);

    if (user?.resource?.id !== id) throw new Error(logMsgs.getInvalidUserId(id));

    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const params = qs.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state: id
    });

    const authUrl = `${authEndpoint}?${params}`;
    return {
      status: 302,
      headers: {
        Location: authUrl,
      },
    };
  } catch (error) {
    logger.error(error, `SPOTIFY-AUTH-ERROR-${id || Date.now()}`);

    return resUtil.error(200, error);
  } finally {
    logger.flush();
  }
};
