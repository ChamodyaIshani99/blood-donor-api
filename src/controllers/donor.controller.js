import { z } from "zod";
import User from "../models/User.js";
import { BLOOD_GROUPS, DISTRICTS, DONATION_GAP_DAYS } from "../config/constants.js";
import { ApiError, asyncHandler } from "../utils/asyncHandler.js";
import { paginationShape, pageMeta } from "../utils/paginate.js";

// "?bloodGroup=O+" arrives as "O " (a + in a query string means space), so fix that
const bloodGroupParam = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/ /g, "+") : v),
  z.enum(BLOOD_GROUPS)
);

export const searchDonorsSchema = z.object({
  bloodGroup: bloodGroupParam.optional(),
  district: z.enum(DISTRICTS).optional(),
  area: z.string().trim().max(60).optional(),
  ...paginationShape,
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// phone is only returned if the donor allows it
const toPublicDonor = (u) => ({
  id: u._id,
  name: u.name,
  bloodGroup: u.bloodGroup,
  district: u.district,
  area: u.area,
  phone: u.showPhone ? u.phone : null,
});

export const searchDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, district, area, page, limit } = req.query;

  const cutoff = new Date(Date.now() - DONATION_GAP_DAYS * 24 * 60 * 60 * 1000);
  const filter = {
    _id: { $ne: req.user._id },
    isAvailable: true,
    $or: [{ lastDonationDate: null }, { lastDonationDate: { $lte: cutoff } }],
  };
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (district) filter.district = district;
  if (area) filter.area = new RegExp(escapeRegex(area), "i");

  const [donors, total] = await Promise.all([
    User.find(filter)
      .select("name phone bloodGroup district area showPhone")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ donors: donors.map(toPublicDonor), meta: pageMeta(page, limit, total) });
});

export const getDonor = asyncHandler(async (req, res) => {
  const donor = await User.findById(req.params.id).select(
    "name phone bloodGroup district area showPhone isAvailable lastDonationDate"
  );
  if (!donor) throw new ApiError(404, "Donor not found");

  res.json({
    donor: { ...toPublicDonor(donor), isAvailable: donor.isAvailable, isEligible: donor.isEligible },
  });
});
