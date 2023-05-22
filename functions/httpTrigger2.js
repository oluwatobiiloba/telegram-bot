const { app } = require('@azure/functions');
const resUtil = require('../utils/res-util');

app.http('httpTrigger2', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || (await request.text()) || 'world';

    return resUtil.success(`Hello, ${name}!`);
  },
});
