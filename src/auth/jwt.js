const jwt = require('jsonwebtoken');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function signAccessToken(payload) {
  return jwt.sign(payload, requireEnv('JWT_SECRET'), {
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, requireEnv('JWT_SECRET'));
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};