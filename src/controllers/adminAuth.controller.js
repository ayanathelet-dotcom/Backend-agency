const jwt = require("jsonwebtoken");
const AdminAuth = require("../models/adminAuth.model.js");
const AppError = require("../utils/AppError.js");
const asyncHandler = require("../utils/asyncHandler.js");

const cookieOptions = () => ({
  httpOnly: true, // JavaScript in the browser can't read it (protects against XSS)
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAMESITE || "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // keep in sync with JWT_EXPIRES_IN
});

// POST /api/admin/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required", 400);

  const admin = await AdminAuth.findOne({ email: email.toLowerCase().trim() }).select("+password");

  // same message for wrong email and wrong password, so attackers can't tell which was wrong
  if (!admin || !(await admin.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie("token", token, cookieOptions());
  res.json({
    success: true,
    message: "Logged in",
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

// POST /api/admin/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie("token", options);
  res.json({ success: true, message: "Logged out" });
});

// GET /api/admin/auth/me  (protected) - dashboard uses this to check if you're still logged in
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

module.exports = {
  login,
  logout,
  getMe,
};
