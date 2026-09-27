const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: "Passenger", required: true, index: true },
    pnr: { type: String, required: true, unique: true, index: true },
    trainNumber: { type: String, required: true },
    trainName: { type: String, required: true },
    route: { type: String, required: true },
    coach: { type: String, required: true },
    berth: { type: Number, required: true },
    journeyDate: { type: Date, required: true },
    // computed at seed/read time from journeyDate vs now — kept here too so it can be queried/filtered directly
    status: { type: String, enum: ["upcoming", "ongoing", "completed"], default: "upcoming" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
