// Run once: npm run seed:admin
// Creates YOUR admin account from .env (there is no public register route, on purpose)
require("dotenv").config();
const mongoose = require("mongoose");
const AdminAuth = require("../src/models/adminAuth.model.js");

const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

const run = async () => {
  if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env first");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const exists = await AdminAuth.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (exists) {
    console.log("Admin already exists:", exists.email);
  } else {
    await AdminAuth.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    console.log("Admin created:", ADMIN_EMAIL);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
