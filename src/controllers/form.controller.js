const mongoose = require("mongoose");
const Form = require("../models/form.model.js");
const { ENQUIRY_STATUSES } = require("../utils/constants.js");
const AppError = require("../utils/AppError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { getPagination, escapeRegex } = require("../utils/helpers.js");

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid enquiry ID", 400);
};

/* ======================= PUBLIC (website) ======================= */

// POST /api/enquiries
const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, message, preferredDate, preferredDay, website } = req.body;
  const successMessage = "Thanks! We've received your enquiry and will get back to you soon.";

  // honeypot: real users never see/fill the hidden "website" field, bots do
  if (website) return res.status(201).json({ success: true, message: successMessage });

  const date = new Date(preferredDate);
  if (!preferredDate || isNaN(date.getTime())) {
    throw new AppError("A valid preferred date is required", 400);
  }
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  if (date < startOfToday) throw new AppError("Preferred date must be today or later", 400);

  // whitelist fields: visitors can NEVER set status or internalNotes
  await Form.create({
    name,
    email,
    message,
    preferredDate: date,
    preferredDay,
    ip: req.ip,
  });

  res.status(201).json({ success: true, message: successMessage });
});

/* ======================= ADMIN (dashboard) ======================= */

// GET /api/admin/enquiries?status=&search=&page=&limit=
const getEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 100);
  const filter = {};
  if (ENQUIRY_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) {
    const regex = { $regex: escapeRegex(req.query.search), $options: "i" };
    filter.$or = [{ name: regex }, { email: regex }, { message: regex }];
  }

  const [enquiries, total] = await Promise.all([
    Form.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Form.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: enquiries,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/enquiries/stats -> counts per status
const getEnquiryStats = asyncHandler(async (req, res) => {
  const grouped = await Form.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const stats = { total: 0 };
  ENQUIRY_STATUSES.forEach((s) => (stats[s] = 0));
  grouped.forEach((g) => {
    stats[g._id] = g.count;
    stats.total += g.count;
  });
  res.json({ success: true, data: stats });
});

// GET /api/admin/enquiries/:id
const getEnquiryById = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const enquiry = await Form.findById(req.params.id).lean();
  if (!enquiry) throw new AppError("Enquiry not found", 404);
  res.json({ success: true, data: enquiry });
});

// PATCH /api/admin/enquiries/:id   (status, internalNotes only)
const updateEnquiry = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const updates = {};
  ["status", "internalNotes"].forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (Object.keys(updates).length === 0) throw new AppError("Nothing to update", 400);

  const enquiry = await Form.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!enquiry) throw new AppError("Enquiry not found", 404);
  res.json({ success: true, data: enquiry });
});

// DELETE /api/admin/enquiries/:id
const deleteEnquiry = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const enquiry = await Form.findByIdAndDelete(req.params.id);
  if (!enquiry) throw new AppError("Enquiry not found", 404);
  res.json({ success: true, message: "Enquiry deleted" });
});

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryStats,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};
