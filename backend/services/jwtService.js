const jwt = require('jsonwebtoken');

const getJwtConfig = () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '8h'
});

const signToken = (payload) => {
  const { secret, expiresIn } = getJwtConfig();

  return jwt.sign(payload, secret, {
    expiresIn
  });
};

const signAdminToken = (payload) => {
  return signToken(payload);
};

const signUserToken = (payload) => {
  return signToken(payload);
};

module.exports = {
  signAdminToken,
  signUserToken
};