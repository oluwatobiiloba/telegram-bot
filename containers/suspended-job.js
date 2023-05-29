function container(model) {
  return {
    create(id, data) {
      return model.items.create({
        id,
        partitionKey: id,
        data,
      });
    },
    get(id) {
      return model.item(id, id).read();
    },

    update(id, data) {
      return model.item(id, id).replace({
        id,
        partitionKey: id,
        data,
      });
    },

    delete(id) {
      return model.item(id, id).delete();
    },
  };
}

container.config = {
  name: 'suspendedJob',
};

module.exports = container;
