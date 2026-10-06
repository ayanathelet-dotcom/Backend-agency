const { Router } = require("express");
const {
  getPublicVideos,
  getPublicVideoById,
  getAdminVideos,
  getVideoStats,
  getAdminVideoById,
  uploadVideo,
  updateVideo,
  deleteVideo,
} = require("../controllers/video.controller.js");
const { protect } = require("../middleware/auth.middleware.js");
const { uploadVideo: uploadMiddleware } = require("../middleware/upload.middleware.js");

const router = Router();

// ---- public (website) ----
router.get("/videos", getPublicVideos);
router.get("/videos/:id", getPublicVideoById);

// ---- admin (dashboard) ----
router.get("/admin/videos", protect, getAdminVideos);
router.get("/admin/videos/stats", protect, getVideoStats); // must stay above /:id
router.get("/admin/videos/:id", protect, getAdminVideoById);
router.post("/admin/videos", protect, uploadMiddleware.single("video"), uploadVideo);
router.patch("/admin/videos/:id", protect, updateVideo);
router.delete("/admin/videos/:id", protect, deleteVideo);

module.exports = router;
