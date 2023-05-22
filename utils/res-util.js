const response = (code, error, resData) => {
  let body = {
    code,
    message: 'error',
    data: null,
  };

  if (error) {
    body.message = error.message;
  } else {
    body.message = 'success';

    if (typeof resData !== 'object') {
      body.data = { message: resData, data: null };
    } else {
      body.data = { message: resData.message || 'SUCCESSFUL', data: resData.data };
    }
  }

  return {
    status: code,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  };
};

module.exports = {
  error: (code, error) => response(code, error),
  success: (data) => response(200, null, data),
};
