import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { BLOOD_GROUPS, DISTRICTS, DONATION_GAP_DAYS } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    district: { type: String, enum: DISTRICTS, required: true },
    area: { type: String, trim: true, default: "" },
    isAvailable: { type: Boolean, default: true },
    lastDonationDate: { type: Date, default: null },
    showPhone: { type: Boolean, default: true },
    expoPushToken: { type: String, default: null },
  },
  { timestamps: true }
);

// fast donor search by group + district + availability
userSchema.index({ bloodGroup: 1, district: 1, isAvailable: 1 });

userSchema.virtual("isEligible").get(function () {
  if (!this.lastDonationDate) return true;
  const days = (Date.now() - this.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24);
  return days >= DONATION_GAP_DAYS;
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.expoPushToken;
    delete ret.__v;
    delete ret.id;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
