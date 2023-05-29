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

    update(id, patchSpec) {
      return model.item(id, id).patch(patchSpec);
    },

    delete(id) {
      return model.item(id, id).delete();
    },
  };
}

container.config = {
  name: 'user',
};

module.exports = container;
