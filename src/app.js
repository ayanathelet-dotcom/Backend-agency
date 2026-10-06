const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const adminAuthRoutes = require("./routes/adminAuth.routes.js");
const videoRoutes = require("./routes/video.routes.js");
const formRoutes = require("./routes/form.routes.js");
const { notFound, errorHandler } = require("./middleware/error.middleware.js");

const app = express();

// needed when hosted behind a proxy (Render, Railway, Nginx) so req.ip is correct
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (process.env.CLIENT_URLS || "").split(",").map((u) => u.trim()),
    credentials: true, // required so the browser sends/receives the auth cookie
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api", adminAuthRoutes);
app.use("/api", videoRoutes);
app.use("/api", formRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
