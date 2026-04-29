const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail(401, 'Authorization token is required');
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    return res.fail(500, 'Authentication service is not configured');
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (err) {
    return res.fail(401, 'Invalid or expired token');
  }
}


module.exports = authMiddleware;
