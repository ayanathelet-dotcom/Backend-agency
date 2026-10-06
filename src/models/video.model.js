const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Video name is required"], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    video: {
      url: { type: String, required: true }, // ImageKit URL used by the website
      fileId: { type: String, required: true }, // ImageKit file id, needed to delete it later
      thumbnailUrl: { type: String },
    },
    // draft = visible only in dashboard, published = visible on website too
    status: { type: String, enum: ["draft", "published"], default: "published" },
  },
  { timestamps: true }
);

videoSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Video", videoSchema);
