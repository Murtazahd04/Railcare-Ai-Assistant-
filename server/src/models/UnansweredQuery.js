const mongoose = require("mongoose");

// Anything the AI ended up transferring because nothing in the KB cleared
// even the loose clarify threshold. Reviewed from the Admin Training
// Dashboard so gaps in the knowledge base show up as data, not guesswork.
const unansweredQuerySchema = new mongoose.Schema(
  {
    utterance: { type: String, required: true },
    bestConfidence: { type: Number, default: 0 }, // highest confidence any candidate reached, even if below threshold
    source: { type: String }, // "local" | "remote" (ai-service) — whichever classifier produced the (non-)match
    pnr: { type: String },
    occurrences: { type: Number, default: 1 }, // bumped when the same/very similar utterance repeats
    reviewed: { type: Boolean, default: false },
    addedAsIntentId: { type: mongoose.Schema.Types.ObjectId, ref: "KbIntent" }, // set once a reviewer turns this into training data
  },
  { timestamps: true }
);

module.exports = mongoose.model("UnansweredQuery", unansweredQuerySchema);
