
const { QueueClient } = require("@azure/storage-queue");
const {AZURE_STORAGE_CONNECTION_STRING, PROCESS_DOC_QUEUE} = process.env
const queueClient = new QueueClient(AZURE_STORAGE_CONNECTION_STRING, PROCESS_DOC_QUEUE);
const { logMsgs } = require("../../messages")

module.exports = {
  async sendMessage(name, data) {
    try {
      if (!data || !name) throw Error(logMsgs.NO_MESSAGE_FOUND);

      const payload = JSON.stringify({name,data})

      const sendMessage = await queueClient.sendMessage(payload);
      return sendMessage.messageId
    } catch (error) {
      // console.log(error);
      throw error;
    }
  },
}
