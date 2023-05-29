const TimeLogger = require('../../utils/timelogger');
const { logMsgs } = require('../../messages');
const suspendedJobDao = require('../../daos/suspended-job');
const middlewareHandler = require('../handlers/middleware-handler');

async function service(data, bot) {
  const { id: userId } = data;

  if (!userId) throw new Error(logMsgs.ID_IS_REQUIRED);

  const { resource } = await suspendedJobDao.getJob(userId);

  if (!resource?.data) throw new Error(logMsgs.MISSING_JOB_DATA);

  const { mws, handler, reqArgs } = resource.data;

  // this is done out here prevent bot error in the catch block
  if (!reqArgs.chatId) throw new Error(logMsgs.NO_CHAT_ID);

  let timeLogger;
  // add bot to the reqArgs object again
  try {
    if (!handler) throw new Error(logMsgs.MISSING_JOB_DATA);

    timeLogger = new TimeLogger(`PROCESS-SUSPENDED-JOB-DURATION-${userId || Date.now()}`);

    reqArgs.bot = bot;

    timeLogger.start(`running-suspended-${handler}-middlewares`);

    if (mws?.length) {
      reqArgs.handler = handler;
      await middlewareHandler(mws, reqArgs);
    }

    timeLogger.end(`running-suspended-${handler}-middlewares`);

    delete reqArgs.handler;

    const handlerFunc = require(`../request-handlers/${handler}`);

    timeLogger.start(`running-${handler}-function`);

    const funcRes = await handlerFunc(reqArgs);

    timeLogger.end(`running-${handler}-function`);

    await suspendedJobDao.deleteJob(userId);

    return funcRes;
  } catch (error) {
    error.message = `PROCESS-SUSPENDED-JOB-ERROR-${userId} -> ${error.message}`;

    throw error;
  } finally {
    if (timeLogger) timeLogger.log();
  }
}

module.exports = service;
