const jwt = require("jsonwebtoken");
const AdminAuth = require("../models/adminAuth.model.js");
const AppError = require("../utils/AppError.js");
const asyncHandler = require("../utils/asyncHandler.js");

// Protects every admin route: verifies the JWT and attaches the admin to req.admin
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  // optional fallback for tools like Postman
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) throw new AppError("Not authorized, please log in", 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Session expired or invalid, please log in again", 401);
  }

  const admin = await AdminAuth.findById(decoded.id).select("-password");
  if (!admin) throw new AppError("Admin no longer exists", 401);

  req.admin = admin;
  next();
});

module.exports = {
  protect,
};
