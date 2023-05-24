require('dotenv').config();
require('../queue-workers/worker');
const logger = require('../utils/logger');

logger.info(`Worker started at ${new Date().toISOString()} on ${process.env.ENV}/${process.platform}.`, 'WORKER-STARTED-WITH-NPM');
const { spawn } = require('child_process');
try {

  spawn(`func start`, [], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell:true,
  })

  logger.info(`Func worker started at ${new Date().toISOString()} on ${process.env.ENV}/${process.platform}.`, 'FUNC-STARTED');
} catch (e) {
  logger.error(e, 'FUNC-ERROR');
  console.log(e, '\n');
}
