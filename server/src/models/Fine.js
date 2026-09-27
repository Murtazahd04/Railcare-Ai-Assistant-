const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema(
  {
    passengerName: { type: String, required: true },
    pnr: { type: String, required: true, index: true },
    reason: { type: String, required: true }, // e.g. "Berth mismatch", "Linen not returned"
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "appealed", "waived"], default: "pending" },
    qrDataUrl: { type: String }, // generated payment QR (demo only)
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpayPaymentLinkId: { type: String }, // for the QR-code-emailed-to-passenger flow (Payment Links API), separate from the in-app Checkout order flow above
    razorpayPaymentLinkUrl: { type: String },
    overrideEmail: { type: String }, // executive-entered email, used when the passenger has none on file
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fine", fineSchema);
