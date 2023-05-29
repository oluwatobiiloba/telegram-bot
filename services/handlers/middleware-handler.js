// Handles middleware chain calls before request handler is called
const middlewares = require('../../middlewares');

module.exports = async function (mws, reqArgs) {
  if (!Array.isArray(mws)) return;
  try {
    reqArgs.mws = mws;

    for (let mw of mws) {
      const mwFunc = middlewares[mw];

      if (typeof mwFunc === 'function') {
        await mwFunc(reqArgs);
      }

      reqArgs.mws.shift();
    }
    
    // this is done to ensure we do not send unnecessary data to the request handlers
    delete reqArgs.mws;
  } catch (err) {
    throw err;
  }
};
