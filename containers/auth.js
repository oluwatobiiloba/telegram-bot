function container(model) {
    return {
      create(id, auth, suspendedJob) {
        return model.items.create({
          id: id,
          partitionKey: id,
          auth,
            suspendedJob
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
  