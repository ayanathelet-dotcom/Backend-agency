const { Router } = require("express");
const { login, logout, getMe } = require("../controllers/adminAuth.controller.js");
const { protect } = require("../middleware/auth.middleware.js");

const router = Router();

router.post("/admin/auth/login", login);
router.post("/admin/auth/logout", logout);
router.get("/admin/auth/me", protect, getMe);

module.exports = router;
