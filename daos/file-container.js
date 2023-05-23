const { file } = require('../containers');

module.exports = {
  uploadDocument(document) {
    return file.create({
      id: document.upload_id,
      partitionKey: document.upload_id,
      document: document,
      chatId: document.chatId,
    });
  },
  async findDocument(id) {
    const idStr = id.toString();
    const { resource } = await file.get(idStr);

    return resource || null;
  },
};
