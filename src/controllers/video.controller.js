const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Video = require("../models/video.model.js");
const imagekit = require("../config/imagekit.js");
const AppError = require("../utils/AppError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { getPagination, escapeRegex } = require("../utils/helpers.js");
const { createReadStream } = require("fs");

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid video ID", 400);
};

/* ======================= PUBLIC (website) ======================= */

// GET /api/videos  -> only published videos, no internal fields
const getPublicVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "published" };

  const [videos, total] = await Promise.all([
    Video.find(filter)
      .select("name description video.url video.thumbnailUrl createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Video.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: videos,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/videos/:id
const getPublicVideoById = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const video = await Video.findOne({ _id: req.params.id, status: "published" })
    .select("name description video.url video.thumbnailUrl createdAt")
    .lean();
  if (!video) throw new AppError("Video not found", 404);
  res.json({ success: true, data: video });
});

/* ======================= ADMIN (dashboard) ======================= */

// GET /api/admin/videos?status=&search=&page=&limit=
const getAdminVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 100);
  const filter = {};
  if (["draft", "published"].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search), $options: "i" };

  const [videos, total] = await Promise.all([
    Video.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Video.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: videos,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/videos/stats -> { total, published, draft }
const getVideoStats = asyncHandler(async (req, res) => {
  const grouped = await Video.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const stats = { total: 0, published: 0, draft: 0 };
  grouped.forEach((g) => {
    stats[g._id] = g.count;
    stats.total += g.count;
  });
  res.json({ success: true, data: stats });
});

// GET /api/admin/videos/:id
const getAdminVideoById = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const video = await Video.findById(req.params.id).lean();
  if (!video) throw new AppError("Video not found", 404);
  res.json({ success: true, data: video });
});

// POST /api/admin/videos   (multipart/form-data: video file + name + description + status)
const uploadVideo = asyncHandler(async (req, res) => {
  const file = req.file;
  try {
    if (!file) throw new AppError("Video file is required (field name: video)", 400);
    const { name, description, status } = req.body;
    if (!name?.trim()) throw new AppError("Video name is required", 400);

    const uploaded = await imagekit.files.upload({
    file: createReadStream(file.path),
    fileName: `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`,
    folder: "/portfolio",
});

    let doc;
    try {
      doc = await Video.create({
        name,
        description,
        status,
        video: {
          url: uploaded.url,
          fileId: uploaded.fileId,
          thumbnailUrl: uploaded.thumbnailUrl,
        },
      });
    } catch (err) {
      // DB save failed -> remove the file from ImageKit so it isn't orphaned
      await imagekit.files.delete(uploaded.fileId).catch(() => {});
      throw err;
    }

    res.status(201).json({ success: true, data: doc });
  } finally {
    if (file) await fs.unlink(file.path).catch(() => {}); // always clean the temp file
  }
});

// PATCH /api/admin/videos/:id   (name, description, status only)
const updateVideo = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const updates = {};
  ["name", "description", "status"].forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (Object.keys(updates).length === 0) throw new AppError("Nothing to update", 400);

  const video = await Video.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!video) throw new AppError("Video not found", 404);
  res.json({ success: true, data: video });
});

// DELETE /api/admin/videos/:id  -> removes from ImageKit AND the database
const deleteVideo = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const video = await Video.findById(req.params.id);
  if (!video) throw new AppError("Video not found", 404);

  try {
    await imagekit.files.delete(video.video.fileId);
  } catch (err) {
    console.error("ImageKit delete failed:", err.message); // still remove the DB record
  }

  await video.deleteOne();
  res.json({ success: true, message: "Video deleted" });
});

module.exports = {
  getPublicVideos,
  getPublicVideoById,
  getAdminVideos,
  getVideoStats,
  getAdminVideoById,
  uploadVideo,
  updateVideo,
  deleteVideo,
};
