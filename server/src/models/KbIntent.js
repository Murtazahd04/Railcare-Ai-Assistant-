const mongoose = require("mongoose");

const kbIntentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Missing Blanket"
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "KbCategory", required: true },
    questions: [{ type: String }],   // sample training questions (en/hi/hinglish mixed)
    synonyms: [{ type: String }],
    keywords: [{ type: String }],
    // which languages this intent's `questions` actually cover — lets the
    // Admin Training Dashboard show/filter coverage gaps at a glance.
    // ISO-ish short codes: en, hi, hi-latn (Hinglish), mr, gu, ta, bn...
    languages: { type: [String], default: ["en", "hi"] },
    expectedAction: { type: String, default: "" }, // e.g. "notify_coach_attendant"
    expectedAnswer: { type: String, default: "" }, // template reply, may use {placeholders}
    confidenceThreshold: { type: Number, default: 0.7 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KbIntent", kbIntentSchema);
