require('dotenv').config();
require('./queue-workers/worker');

const { spawn } = require('child_process');
try {
  spawn(`func start`, [], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell:true,
  })
} catch (e) {
  console.log(e, '\n');
}
