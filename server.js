const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/files", express.static(uploadDir, { index: false, dotfiles: "deny" }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 12);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
  }
});
const allowed = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.has(ext)) return cb(new Error("Only PDF and image files are allowed."));
    cb(null, true);
  }
});

let jobs = [];
function adminOnly(req, res, next) {
  const supplied = req.get("x-admin-password");
  if (!supplied || supplied !== ADMIN_PASSWORD) return res.status(401).json({ error: "Admin password is incorrect." });
  next();
}

app.get("/api/config", (_req, res) => {
  res.json({ uploadLimitMB: 15, maxFiles: 5, accepted: "PDF, JPG, PNG, WEBP" });
});

app.post("/api/upload", upload.array("files", 5), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Please choose at least one file." });
  const name = String(req.body.customerName || "").trim().slice(0, 80);
  const phone = String(req.body.phone || "").trim().slice(0, 20);
  const copies = Math.min(100, Math.max(1, parseInt(req.body.copies || "1", 10) || 1));
  const color = req.body.color === "color" ? "color" : "black-white";
  const paper = req.body.paper === "A4" ? "A4" : "A4";
  const job = {
    id: `QP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: name || "Customer",
    phone,
    copies,
    color,
    paper,
    status: "Pending",
    createdAt: new Date().toISOString(),
    files: req.files.map(f => ({
      originalName: path.basename(f.originalname),
      storedName: f.filename,
      size: f.size,
      url: `/files/${encodeURIComponent(f.filename)}`
    }))
  };
  jobs.unshift(job);
  res.json({ ok: true, jobId: job.id, message: "Files submitted successfully. Please show your job ID at the counter." });
});

app.post("/api/admin/login", (req, res) => {
  if (String(req.body.password || "") !== ADMIN_PASSWORD) return res.status(401).json({ error: "Incorrect password." });
  res.json({ ok: true });
});
app.get("/api/admin/jobs", adminOnly, (_req, res) => res.json(jobs));
app.patch("/api/admin/jobs/:id", adminOnly, (req, res) => {
  const allowedStatuses = ["Pending", "Printing", "Completed"];
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found." });
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ error: "Invalid status." });
  job.status = req.body.status;
  res.json({ ok: true, job });
});
app.get("/api/qr", async (_req, res) => {
  try {
    const png = await QRCode.toDataURL(`${PUBLIC_BASE_URL}/upload.html`, { width: 320, margin: 2 });
    res.json({ dataUrl: png, target: `${PUBLIC_BASE_URL}/upload.html` });
  } catch {
    res.status(500).json({ error: "Could not generate QR code." });
  }
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/stats", adminOnly, (req, res) => {
    let total = jobs.length;
    let pending = jobs.filter(j => j.status === "Pending" || !j.status).length;
    let completed = jobs.filter(j => j.status === "Completed").length;
    res.json({ total, pending, completed });
});

app.use((err, _req, res, _next) => {
  const message = err.code === "LIMIT_FILE_SIZE" ? "Each file must be 15 MB or smaller." : (err.message || "Upload failed.");
  res.status(400).json({ error: message });
});

app.listen(PORT, () => console.log(`QR to Print running at http://localhost:${PORT}`));
