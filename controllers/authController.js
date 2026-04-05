const User = require('../models/User');
const AppError = require('../utils/appError');
const { signUserToken } = require('../services/jwtService');

const createAuthResponse = (user) => {
  const tokenPayload = {
    id: user._id.toString(),
    role: user.role
  };

  return {
    success: true,
    token: signUserToken(tokenPayload),
    user: user.toSafeObject()
  };
};

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      subscription: {
        plan: 'free',
        premium: false,
        status: 'inactive',
        payment: {}
      }
    });

    return res.status(201).json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    return res.status(200).json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe
};