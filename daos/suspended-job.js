const { suspendedjob } = require('../containers');

module.exports = {
  createJob(id, data) {
    const idStr = id.toString();

    return suspendedjob.create(idStr, data);
  },

  getJob(id) {
    const idStr = id.toString();

    return suspendedjob.get(idStr);
  },

  async findOrCreateJob(id, data) {
    let job = await this.getJob(id);

    if (!job?.resource) {
      job = await this.createJob(id, data);
      job.isNew = true;
    }

    return job;
  },

  updateJob(id, data) {
    const idStr = id.toString();

    return suspendedjob.update(idStr, data);
  },

  deleteJob(id) {
    const idStr = id.toString();

    return suspendedjob.delete(idStr);
  }
};
