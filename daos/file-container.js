const { file } = require('../containers');

module.exports = {
  uploadDocument(document) {
    return file.create({
      id: document.id,
      partitionKey: document.id,
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
