import mongoose from "mongoose";
import {
  BLOOD_GROUPS, DISTRICTS, URGENCY_LEVELS, REQUEST_STATUSES, URGENCY_RANK,
} from "../config/constants.js";

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, trim: true, default: "" },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    units: { type: Number, min: 1, max: 10, default: 1 },
    hospital: { type: String, required: true, trim: true },
    district: { type: String, enum: DISTRICTS, required: true },
    urgency: { type: String, enum: URGENCY_LEVELS, default: "Normal" },
    urgencyRank: { type: Number, default: 1 }, // for sorting (Critical first)
    neededBy: { type: Date, required: true },
    contactPhone: { type: String, required: true, trim: true },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: REQUEST_STATUSES, default: "open" },
  },
  { timestamps: true }
);

bloodRequestSchema.pre("validate", function () {
  this.urgencyRank = URGENCY_RANK[this.urgency] ?? 1;
});

bloodRequestSchema.index({ status: 1, district: 1, bloodGroup: 1, urgencyRank: -1, neededBy: 1 });
bloodRequestSchema.index({ requester: 1, createdAt: -1 });

bloodRequestSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.urgencyRank;
    return ret;
  },
});

export default mongoose.model("BloodRequest", bloodRequestSchema);
