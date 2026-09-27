const express = require("express");
const Train = require("../models/Train");
const { listWithQuery } = require("../utils/listQuery");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await listWithQuery(Train, req, ["name", "number"]);
  res.json(result);
});

router.get("/:id", requireAuth, async (req, res) => {
  const t = await Train.findById(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  res.json(t);
});

router.get("/:id/coaches", requireAuth, async (req, res) => {
  const t = await Train.findById(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  res.json(t.coaches);
});

router.post("/", requireAuth, async (req, res) => {
  const t = await Train.create(req.body);
  res.status(201).json(t);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const t = await Train.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) return res.status(404).json({ error: "Not found" });
  res.json(t);
});

module.exports = router;
