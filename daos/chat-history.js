const { chatHistory } = require('../containers');

module.exports = {
  createHistory(id) {
    const idStr = id.toString();

    return chatHistory.create(idStr);
  },

  async getHistory(id) {
    let history = [];
    const idStr = id.toString();

    const { resource } = await chatHistory.get(idStr);

    if (!resource) {
      await chatHistory.create(idStr);
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

    return chatHistory.update(idStr, history);
  },

  overwriteHistory(id, messages) {
    const idStr = id.toString();

    let history = messages;

    if (!Array.isArray(messages)) history = [messages];
    
    return chatHistory.update(idStr, history);
  },

  deleteHistory(id) {
    const idStr = id.toString();

    return chatHistory.delete(idStr);
  },
};
