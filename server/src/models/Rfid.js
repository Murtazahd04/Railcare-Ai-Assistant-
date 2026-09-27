const mongoose = require("mongoose");

const STAGES = ["laundry", "store", "transport", "train", "coach", "berth", "return"];

const rfidEventSchema = new mongoose.Schema(
  {
    stage: { type: String, enum: STAGES, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const rfidSchema = new mongoose.Schema(
  {
    tagId: { type: String, required: true, unique: true, index: true },
    kitType: { type: String, enum: ["Blanket", "Bedsheet", "Pillow Cover", "Towel"], default: "Blanket" },
    currentStage: { type: String, enum: STAGES, default: "laundry" },
    trainNumber: { type: String },
    coach: { type: String },
    berth: { type: Number },
    history: [rfidEventSchema],
  },
  { timestamps: true }
);

const RfidModel = mongoose.model("Rfid", rfidSchema);
RfidModel.STAGES = STAGES;
module.exports = RfidModel;
