const AppError = require("../utils/AppError.js");

const notFound = (req, res, next) =>
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID";
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate value";
  } else if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Video file is too large" : err.message;
  }

  if (status === 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") message = "Something went wrong";
  }

  res.status(status).json({ success: false, message });
};

module.exports = {
  notFound,
  errorHandler,
};
