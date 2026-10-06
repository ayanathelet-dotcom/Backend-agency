const { Router } = require("express");
const {
  createEnquiry,
  getEnquiries,
  getEnquiryStats,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} = require("../controllers/form.controller.js");
const { protect } = require("../middleware/auth.middleware.js");

const router = Router();

// ---- public (website): visitors can ONLY create ----
router.post("/enquiries", createEnquiry);

// ---- admin (dashboard) ----
router.get("/admin/enquiries", protect, getEnquiries);
router.get("/admin/enquiries/stats", protect, getEnquiryStats); // must stay above /:id
router.get("/admin/enquiries/:id", protect, getEnquiryById);
router.patch("/admin/enquiries/:id", protect, updateEnquiry);
router.delete("/admin/enquiries/:id", protect, deleteEnquiry);

module.exports = router;
