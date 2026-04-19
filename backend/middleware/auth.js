const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const auth = (req, res, next) => {
  try {
    console.log('Auth cookies:', req.cookies);
    const token = req.cookies && req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
};

module.exports = auth;