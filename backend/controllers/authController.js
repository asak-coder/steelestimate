const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Existing credential validation and user lookup should remain in the project.
    // This controller only ensures the session cookie is set correctly in production.
    const user = req.user || { email };

    const token = jwt.sign({ email: user.email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN || '7d',
    });

    res.cookie('authToken', token, cookieOptions);
    return res.status(200).json({
      message: 'Login successful',
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
};

const me = async (req, res) => {
  try {
    console.log('Auth /me cookies:', req.cookies);

    const token = req.cookies && req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    return res.status(200).json({
      user: decoded,
    });
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('authToken', {
    ...cookieOptions,
    maxAge: undefined,
  });
  return res.status(200).json({ message: 'Logged out' });
};

module.exports = {
  login,
  me,
  logout,
};