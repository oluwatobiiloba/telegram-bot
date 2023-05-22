function container(model) {
  return {
    create(data) {
      return model.items.create(data);
    },
    get(id) {
      return model.item(id, id).read();
    },
  };
}

container.config = {
  name: 'fileContainer',
};

module.exports = container;
