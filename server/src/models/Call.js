const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    customerId: { type: String }, // set when the caller has a verified JWT (anonymous or logged-in)
    executiveName: { type: String },
    intent: { type: String },
    confidence: { type: Number },
    status: { type: String, enum: ["completed", "missed", "transferred", "rejected", "ai_resolved", "ai_ended"], default: "completed" },
    source: { type: String, enum: ["webrtc", "phone", "ai_chat"], default: "webrtc" },
    rating: { type: Number, min: 1, max: 5 },
    durationSec: { type: Number, default: 0 },
    transcript: [{ speaker: String, text: String, at: { type: Date, default: Date.now } }],
    notes: [{ text: String, at: { type: Date, default: Date.now } }],
    transferredFrom: { type: String },
    transferredTo: { type: String },
    recordingFileId: { type: mongoose.Schema.Types.ObjectId },
    topic: { type: String }, // FAQ topic the customer picked before calling
    customerPnr: { type: String }, // optional, if the customer entered one
    aiIntent: { type: String }, // what the AI classifier matched, if anything
    aiConfidence: { type: Number },
    aiTranscript: [{ speaker: String, text: String, at: { type: Date, default: Date.now } }], // the AI<->customer conversation before transfer/resolution // GridFS file _id, if a recording was uploaded
    // sentiment/urgency-based priority routing (see utils/sentiment.js) — kept
    // on the record so Analytics can later show how often high-priority
    // callers came through, not just how many calls happened
    urgencyTier: { type: String, enum: ["normal", "elevated", "high", "emergency"], default: "normal" },
    urgencyReasons: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);
