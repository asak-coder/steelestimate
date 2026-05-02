const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const issuer = 'steelestimate-api';
const audience = 'steelestimate-admin';

const accessTokenOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  issuer,
  audience
};

const refreshTokenOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  issuer,
  audience
};

const buildPayload = (user) => ({
  id: String(user._id || user.id),
  email: user.email,
  role: user.role
});

const signAccessToken = (user) =>
  jwt.sign(buildPayload(user), env.JWT_SECRET, {
    ...accessTokenOptions,
    subject: String(user._id || user.id)
  });

const signRefreshToken = (user) =>
  jwt.sign(buildPayload(user), env.JWT_REFRESH_SECRET, {
    ...refreshTokenOptions,
    subject: String(user._id || user.id)
  });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET, accessTokenOptions);

const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET, refreshTokenOptions);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
