const mongoose = require("mongoose");

const ROLES = [
  "super_admin", "admin", "supervisor", "executive",
  "coach_attendant", "laundry_manager", "store_manager", "transport_manager", "tte",
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
UserModel.ROLES = ROLES;
module.exports = UserModel;
