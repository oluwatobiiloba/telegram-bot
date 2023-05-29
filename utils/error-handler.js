module.exports = {
  APIError(err) {
    if (
      err.response?.status === 403 &&
      err.response?.data === 'User not registered in the Developer Dashboard'
    ) {
      err.message = 'User not registered in the Developer Dashboard';
    }
    
    const error = new Error(err.message);

    error.context = err.response;

    return error;
  },
};
