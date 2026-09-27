const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Call = require("../models/Call");
const { listWithQuery } = require("../utils/listQuery");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap per recording

function getRecordingsBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "recordings" });
}

router.get("/", requireAuth, async (req, res) => {
  const result = await listWithQuery(Call, req, ["customerName", "executiveName", "callId", "intent"]);
  res.json(result);
});

router.get("/analytics", requireAuth, async (req, res) => {
  const total = await Call.countDocuments();
  const completed = await Call.countDocuments({ status: "completed" });
  const missed = await Call.countDocuments({ status: "missed" });
  const transferred = await Call.countDocuments({ status: "transferred" });

  const agg = await Call.aggregate([{ $group: { _id: null, avgDuration: { $avg: "$durationSec" } } }]);
  const avgDuration = agg[0]?.avgDuration || 0;

  res.json({
    total,
    completed,
    missed,
    transferred,
    aiResolutionPct: total ? +((completed / total) * 100).toFixed(1) : 0,
    transferPct: total ? +((transferred / total) * 100).toFixed(1) : 0,
    avgHandleTimeSec: Math.round(avgDuration),
  });
});

// call volume per day for the last N days (default 14) — for a line/bar chart
router.get("/analytics/timeseries", requireAuth, async (req, res) => {
  const days = Math.min(90, parseInt(req.query.days) || 14);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await Call.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        missed: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
        transferred: { $sum: { $cond: [{ $eq: ["$status", "transferred"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(rows.map((r) => ({ date: r._id, total: r.total, completed: r.completed, missed: r.missed, transferred: r.transferred })));
});

// most common intents across all calls — for a bar/pie chart
router.get("/analytics/top-intents", requireAuth, async (req, res) => {
  const rows = await Call.aggregate([
    { $match: { intent: { $ne: null } } },
    { $group: { _id: "$intent", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  res.json(rows.map((r) => ({ intent: r._id, count: r.count })));
});

// passenger satisfaction — rating distribution (1-5 stars) + overall average,
// across both AI-only chats and real executive calls (both now capture rating)
router.get("/analytics/ratings", requireAuth, async (req, res) => {
  const rows = await Call.aggregate([
    { $match: { rating: { $ne: null } } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    stars: star,
    count: rows.find((r) => r._id === star)?.count || 0,
  }));
  const totalRated = distribution.reduce((sum, d) => sum + d.count, 0);
  const weightedSum = distribution.reduce((sum, d) => sum + d.stars * d.count, 0);
  res.json({
    distribution,
    totalRated,
    averageRating: totalRated ? +(weightedSum / totalRated).toFixed(2) : 0,
  });
});

// per-executive performance — calls handled, avg rating, avg handle time.
// Only counts calls with a named executive (excludes AI-only chats).
router.get("/analytics/executives", requireAuth, async (req, res) => {
  const rows = await Call.aggregate([
    { $match: { executiveName: { $ne: null } } },
    {
      $group: {
        _id: "$executiveName",
        callsHandled: { $sum: 1 },
        avgDuration: { $avg: "$durationSec" },
        avgRating: { $avg: "$rating" },
        ratedCalls: { $sum: { $cond: [{ $ne: ["$rating", null] }, 1, 0] } },
      },
    },
    { $sort: { callsHandled: -1 } },
  ]);
  res.json(
    rows.map((r) => ({
      executiveName: r._id,
      callsHandled: r.callsHandled,
      avgHandleTimeSec: Math.round(r.avgDuration || 0),
      avgRating: r.ratedCalls ? +r.avgRating.toFixed(2) : null,
      ratedCalls: r.ratedCalls,
    }))
  );
});

router.get("/:callId/transcript", requireAuth, async (req, res) => {
  const call = await Call.findOne({ callId: req.params.callId });
  if (!call) return res.status(404).json({ error: "Not found" });
  res.json(call.transcript);
});

router.post("/:callId/notes", requireAuth, async (req, res) => {
  const call = await Call.findOne({ callId: req.params.callId });
  if (!call) return res.status(404).json({ error: "Not found" });
  call.notes.push({ text: req.body.text });
  await call.save();
  res.json(call);
});

// upload a call recording (webm blob from the browser) into MongoDB via GridFS
router.post("/:callId/recording", requireAuth, upload.single("recording"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "recording file is required (field name: recording)" });

  const call = await Call.findOne({ callId: req.params.callId });
  if (!call) return res.status(404).json({ error: "Call not found" });

  const bucket = getRecordingsBucket();
  const uploadStream = bucket.openUploadStream(`${req.params.callId}.webm`, {
    contentType: req.file.mimetype || "audio/webm",
  });
  uploadStream.end(req.file.buffer);

  uploadStream.on("finish", async () => {
    call.recordingFileId = uploadStream.id;
    await call.save();
    res.status(201).json({ callId: call.callId, recordingFileId: uploadStream.id });
  });
  uploadStream.on("error", (err) => {
    console.error("[recording upload] failed:", err.message);
    res.status(500).json({ error: "Failed to store recording" });
  });
});

// stream a stored recording back (e.g. <audio src="...">)
router.get("/:callId/recording", requireAuth, async (req, res) => {
  const call = await Call.findOne({ callId: req.params.callId });
  if (!call || !call.recordingFileId) return res.status(404).json({ error: "No recording for this call" });

  const bucket = getRecordingsBucket();
  res.setHeader("Content-Type", "audio/webm");
  bucket.openDownloadStream(call.recordingFileId)
    .on("error", () => res.status(404).json({ error: "Recording file missing" }))
    .pipe(res);
});

module.exports = router;
