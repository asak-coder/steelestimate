const User = require('../models/User');
const AppError = require('../utils/appError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../services/jwtService');
const { env } = require('../config/env');

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/'
};

if (env.NODE_ENV === 'production') {
  refreshCookieOptions.domain = '.steelestimate.com';
}

const sanitizeUser = (user) => ({
  id: String(user._id || user.id),
  name: user.name,
  email: user.email,
  role: user.role
});

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AppError('Refresh token is required', 401);
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.refreshToken || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (user && user.refreshToken === token) {
          user.refreshToken = null;
          await user.save();
        }
      } catch (error) {
        // ignore invalid token and still clear cookie
      }
    }

    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout
};
