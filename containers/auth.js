function container(model) {
    return {
      create(id, auth) {
        return model.items.create({
          id: id,
          partitionKey: id,
            auth
        });
      },
      get(id) {
        return model.item(id,id).read();
      },
  
      update(id, auth ) {
        return model.item(id, id).replace({
            id: id,
            partitionKey: id,
              auth
        });
      },
  
      delete(id) {
        return model.item(id).delete();
      },
    };
  }
  
  container.config = {
    name: 'auth',
  };
  
  module.exports = container;
  