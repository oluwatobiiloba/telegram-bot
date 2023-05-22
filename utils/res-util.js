const response = (code, error, resData) => {
  let body = {
    message: 'error',
    data: null,
  };

  if (error) {
    body.message = error.message;
    body.error = error;
  } else {
    body.message = 'success';

    if (typeof resData !== 'object') {
      body.data = { message: resData, data: null };
    } else {
      body.data = { message: resData.message || 'SUCCESSFUL', data: resData.data };
    }
  }

  return { status: code, body };
};

module.exports = {
  error: (code, error) => response(code, error),
  success: (data) => response(200, null, data),
};
