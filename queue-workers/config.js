const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

const config = {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
};

module.exports = {
  get: () => config,
  getWithConcurrency: (num) => ({ ...config, concurrency: num }),
};
