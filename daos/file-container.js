const { fileContainer } = require('../containers');

module.exports = {
  uploadDocument(document) {
    return fileContainer.create({
      id: document.file_id,
      partitionKey: document.file_id,
      document: document,
      chatId: document.chatId,
    });
  },
  async findDocument(id) {
    const idStr = id.toString();
    const { resource } = await fileContainer.get(idStr);

    return resource || null;
  },
};
