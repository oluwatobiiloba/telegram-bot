
const { QueueClient } = require("@azure/storage-queue");
const azure_storage_connection_string = process.env.AZURE_STORAGE_CONNECTION_STRING;
const queueName = process.env.QUEUE_NAME;
const queueClient = new QueueClient(azure_storage_connection_string, queueName);


module.exports = {
  async sendMessage(name, data) {
    try {
      if (!data || !name) throw Error('No data/name found');
      let payload = {
         name,
         data
      };

      payload = JSON.stringify(payload);

      const sendMessage = await queueClient.sendMessage(payload);
      return {
        message: 'Action successfully to job queue',
        id: sendMessage.messageId
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
}
