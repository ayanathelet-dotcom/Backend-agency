const multer = require("multer");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../utils/AppError.js");

const MAX_SIZE = (Number(process.env.MAX_VIDEO_SIZE_MB) || 100) * 1024 * 1024;

// Saved to the OS temp folder only briefly; the controller deletes it after the ImageKit upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) return cb(null, true);
  cb(new AppError("Only video files are allowed", 400));
};

// usage: uploadVideo.single("video")
const uploadVideo = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = {
  uploadVideo,
};
