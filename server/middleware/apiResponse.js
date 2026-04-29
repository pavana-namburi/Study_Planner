function apiResponse(req, res, next) {
  res.success = (data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  };

  res.fail = (statusCode, message) => {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  };

  next();
}

module.exports = apiResponse;
