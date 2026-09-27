const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    concernId: { type: String, required: true, unique: true, index: true },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: "Passenger", required: true, index: true },
    passengerName: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["open", "in_progress", "resolved", "rejected"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
