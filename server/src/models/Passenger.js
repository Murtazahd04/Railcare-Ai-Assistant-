const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, index: true },
    email: { type: String }, // optional — only used if the passenger chose to add one; email.js no-ops without it
    pnr: { type: String, required: true, unique: true, index: true },
    trainNumber: { type: String, required: true },
    coach: { type: String, required: true },
    berth: { type: Number, required: true },
    journeyDate: { type: Date, default: Date.now },
    priorComplaints: { type: Number, default: 0 },
    // only set for the demo-login passengers used by the Passenger Portal
    username: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Passenger", passengerSchema);
