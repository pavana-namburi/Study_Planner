function notFound(req, res, next) {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode >= 500 ? 'Something went wrong. Please try again later.' : err.message;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  errorHandler,
  notFound,
};
