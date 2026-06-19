const { verifyAccessToken } = require('../auth/jwt');

function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    const err = new Error('Missing Bearer token');
    err.statusCode = 401;
    return next(err); // ส่งไปที่ errorHandler.js
  }

  const token = auth.split(' ')[1]; // วิธีตัดคำอีกแบบที่นิยม
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    next(error); // ส่งไปที่ errorHandler.js
  }
}

module.exports = authRequired;