const jwt = require("jsonwebtoken");

const getJwtConfig = () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  issuer: process.env.JWT_ISSUER || "steelestimate-api",
  audience: process.env.JWT_AUDIENCE || "steelestimate-admin"
});

const signToken = (payload, options = {}) => {
  const { secret, expiresIn, issuer, audience } = getJwtConfig();

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer,
    audience,
    ...options
  });
};

const signAdminToken = (payload) => signToken(payload, { subject: payload.id });
const signUserToken = (payload) => signToken(payload, { subject: payload.id });

const verifyToken = (token) => {
  const { secret, issuer, audience } = getJwtConfig();

  return jwt.verify(token, secret, {
    issuer,
    audience
  });
};

module.exports = {
  signAdminToken,
  signUserToken,
  verifyToken
};
