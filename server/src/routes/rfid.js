const express = require("express");
const Rfid = require("../models/Rfid");
const { listWithQuery } = require("../utils/listQuery");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { rfidScanSchema } = require("../utils/schemas");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await listWithQuery(Rfid, req, ["tagId", "trainNumber", "coach"]);
  res.json(result);
});

// counts per lifecycle stage — powers the RFID flow diagram.
// Registered before "/:tagId" so "stats" isn't mistaken for a tag ID.
router.get("/stats", requireAuth, async (req, res) => {
  const rows = await Rfid.aggregate([{ $group: { _id: "$currentStage", count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(Rfid.STAGES.map((s) => [s, 0]));
  rows.forEach((r) => { counts[r._id] = r.count; });
  res.json({ stages: Rfid.STAGES, counts, total: rows.reduce((a, r) => a + r.count, 0) });
});

router.get("/:tagId", requireAuth, async (req, res) => {
  const tag = await Rfid.findOne({ tagId: req.params.tagId });
  if (!tag) return res.status(404).json({ error: "Tag not found" });
  res.json(tag);
});

router.get("/:tagId/history", requireAuth, async (req, res) => {
  const tag = await Rfid.findOne({ tagId: req.params.tagId });
  if (!tag) return res.status(404).json({ error: "Tag not found" });
  res.json(tag.history);
});

// log a stage transition — this IS the lifecycle tracking
router.post("/:tagId/scan", requireAuth, validateBody(rfidScanSchema), async (req, res) => {
  const { stage, note, trainNumber, coach, berth } = req.body;
  if (!Rfid.STAGES.includes(stage)) return res.status(400).json({ error: `stage must be one of ${Rfid.STAGES.join(", ")}` });

  const tag = await Rfid.findOne({ tagId: req.params.tagId });
  if (!tag) return res.status(404).json({ error: "Tag not found" });

  tag.currentStage = stage;
  if (trainNumber) tag.trainNumber = trainNumber;
  if (coach) tag.coach = coach;
  if (berth) tag.berth = berth;
  tag.history.push({ stage, note, at: new Date() });
  await tag.save();

  res.json(tag);
});

router.post("/", requireAuth, async (req, res) => {
  const tag = await Rfid.create({ ...req.body, history: [{ stage: req.body.currentStage || "laundry" }] });
  res.status(201).json(tag);
});

module.exports = router;
