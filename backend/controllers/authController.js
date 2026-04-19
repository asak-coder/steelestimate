const User = require("../models/User");
const AppError = require("../utils/appError");
const { signAdminToken, signUserToken } = require("../services/jwtService");

const isPrivilegedRole = (role) => ["ADMIN", "MANAGER"].includes(String(role || "").toUpperCase());

const cookieOptions = () => ({
  httpOnly: true,
  secure: String(process.env.NODE_ENV || "").toLowerCase() === "production",
  sameSite: String(process.env.NODE_ENV || "").toLowerCase() === "production" ? "none" : "lax",
  path: "/",
  maxAge: 8 * 60 * 60 * 1000
});

const createAuthResponse = (user) => ({
  success: true,
  user: user.toSafeObject()
});

const setAuthCookie = (res, user) => {
  const token = isPrivilegedRole(user.role)
    ? signAdminToken({ id: user._id.toString(), role: user.role })
    : signUserToken({ id: user._id.toString(), role: user.role });

  res.cookie("authToken", token, cookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: String(process.env.NODE_ENV || "").toLowerCase() === "production",
    sameSite: String(process.env.NODE_ENV || "").toLowerCase() === "production" ? "none" : "lax",
    path: "/"
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password || !name) {
      throw new AppError("Name, email and password are required", 400);
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError("User already exists with this email", 409);
    }

    const allowedRole = isPrivilegedRole(role) ? String(role).toUpperCase() : "VIEWER";
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: allowedRole
    });

    setAuthCookie(res, user);

    return res.status(201).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    setAuthCookie(res, user);

    return res.status(200).json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};

const getMe = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError("User not found", 404);
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
  register,
  signup: register,
  login,
  logout,
  getMe
};
