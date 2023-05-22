const { chathistory } = require('../containers');

module.exports = {
  createHistory(id) {
    const idStr = id.toString();

    return chathistory.create(idStr);
  },

  async getHistory(id) {
    let history = [];
    const idStr = id.toString();

    const { resource } = await chathistory.get(idStr);

    if (!resource) {
      await chathistory.create(idStr);
    } else {
      history = resource.chatHistory;
    }

    return history;
  },

  async getHistoryByUser(id, userId) {
    const history = await this.getHistory(id);

    const userMessages = history.filter(
      ({ role, userId: uid }) => role === 'user' && uid === userId
    );

    return userMessages;
  },

  async updateHistory(id, messages) {
    const idStr = id.toString();
    let msgs = messages;

    if (!Array.isArray(messages)) msgs = [messages];

    const history = await this.getHistory(id);
    history.push(...messages);

    return chathistory.update(idStr, history);
  },

  overwriteHistory(id, messages) {
    const idStr = id.toString();

    let history = messages;

    if (!Array.isArray(messages)) history = [messages];

    return chathistory.update(idStr, history);
  },

  deleteHistory(id) {
    const idStr = id.toString();

    return chathistory.delete(idStr);
  },
};
