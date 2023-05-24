
const { QueueClient } = require("@azure/storage-queue");
const azure_storage_connection_string = process.env.AZURE_STORAGE_CONNECTION_STRING;
const queueName = process.env.QUEUE_NAME;
const queueClient = new QueueClient(azure_storage_connection_string, queueName);


module.exports = {
  async sendMessage(data) {
    try {
          
      if (!data) throw Error('No data found');
      if (typeof data !== 'string') data = JSON.stringify(data);

      //const options = { visibilityTimeout: data.visibilityTimeout || 30 };
      await queueClient.sendMessage(data);
      return { message: 'Action successfully to job queue' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
}
