const AppError = require("../utils/appError");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const normalizeError = (err) => {
  if (err.name === "ValidationError") {
    return {
      statusCode: 400,
      message: Object.values(err.errors || {})
        .map((item) => item.message)
        .join(", ") || "Validation failed"
    };
  }

  if (err.code === 11000) {
    return {
      statusCode: 409,
      message: "Duplicate field value"
    };
  }

  return {
    statusCode: err.statusCode || 500,
    message: err.message || "Internal server error"
  };
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);

  return res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message
  });
};

module.exports = {
  notFound,
  errorHandler
};
