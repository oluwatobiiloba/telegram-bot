const { CosmosClient } = require('@azure/cosmos');
const dirReader = require('../utils/dir-reader');

const client = new CosmosClient({
  endpoint: process.env.COSMO_ENDPOINT,
  key: process.env.COSMO_KEY,
  userAgentSuffix: 'Azure Function App',
});

const db = client.database(process.env.COSMOS_DB);

module.exports = dirReader(__dirname, module.filename, false, (content) => content(db.container(content.config.name)));
