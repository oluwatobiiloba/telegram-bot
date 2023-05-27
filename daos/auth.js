const { auth } = require('../containers');

module.exports = {
  async createAuth(id, authParams = {}, suspendedJob) {
    
    const idStr = id.toString();
    const { resource } = await auth.get(idStr)

    if (!resource) return auth.create(idStr, authParams,suspendedJob);

    return resource

  },

  async getAuth(id) {
    let authParams = {} ;
    const idStr = id.toString();

    const { resource } = await auth.get(idStr);

    if (!resource) return authParams
    authParams = resource.auth;

    return authParams;
  },


  async updateAuth(id, authParams) {
    const idStr = id.toString();

    return auth.update(idStr, authParams);
  },


  deleteAuth(id) {
    const idStr = id.toString();

    return auth.delete(idStr);
  },

  async checkUser(id) {
    const idStr = id.toString();

    const { resource } = await auth.get(idStr);

    if (!resource) return {
      exists: false
    }

    return {
      exists: true,
      resource
    }
  }
};
