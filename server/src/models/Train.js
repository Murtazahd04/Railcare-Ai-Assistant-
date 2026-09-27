const mongoose = require("mongoose");

const coachSubSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    type: { type: String, enum: ["Sleeper", "AC1", "AC2", "AC3", "General"], default: "AC3" },
    berths: { type: Number, default: 72 },
  },
  { _id: false }
);

const trainSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    route: { type: String },
    coaches: [coachSubSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Train", trainSchema);
