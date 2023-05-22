module.exports = {
  APIError(err) {
    const error = new Error(err.message);

    error.context = err.response.data;

    return error;
  },
};
