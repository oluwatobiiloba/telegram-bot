function container(model) {
  return {
    create(id) {
      return model.items.create({
        id,
        partitionKey: id,
        chatHistory: [],
      });
    },
    get(id) {
      return model.item(id, id).read();
    },

    update(id, history) {
      return model.item(id, id).replace({
        id,
        partitionKey: id,
        chatHistory: history,
      });
    },

    delete(id) {
      return model.item(id, id).delete();
    },
  };
}

container.config = {
  name: 'chatHistory',
};

module.exports = container;
