const mongoose = require("mongoose");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const { ENQUIRY_STATUSES } = require("../utils/constants.js");

const formSchema = new mongoose.Schema(
  {
    // ---- filled by the visitor ----
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    message: { type: String, required: [true, "Message is required"], trim: true, maxlength: 3000 },
    preferredDate: { type: Date, required: [true, "Preferred date is required"] },
    preferredDay: { type: String, enum: DAYS }, // auto-filled from preferredDate if not sent

    // ---- controlled only by you (dashboard) / backend ----
    status: { type: String, enum: ENQUIRY_STATUSES, default: "new" },
    internalNotes: { type: String, default: "", maxlength: 3000 },
    ip: { type: String },
  },
  { timestamps: true }
);

formSchema.pre("validate", function () {
  if (this.preferredDate && !this.preferredDay) {
    this.preferredDay = DAYS[this.preferredDate.getUTCDay()];
  }
});

formSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Form", formSchema);
