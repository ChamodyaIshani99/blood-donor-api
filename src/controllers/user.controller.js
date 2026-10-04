import { z } from "zod";
import { Expo } from "expo-server-sdk";
import User from "../models/User.js";
import { BLOOD_GROUPS, DISTRICTS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2),
    bloodGroup: z.enum(BLOOD_GROUPS),
    district: z.enum(DISTRICTS),
    area: z.string().trim().max(60),
    showPhone: z.boolean(),
    // allow up to 1 day ahead: the app sends a calendar date (UTC midnight), which in UTC+ time zones
    // can be a few hours "ahead" of the server clock. (z.date().max(new Date()) was also fixed at server start.)
    lastDonationDate: z
      .coerce.date()
      .refine((d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, "Date cannot be in the future")
      .nullable(),
  })
  .partial();

export const availabilitySchema = z.object({ isAvailable: z.boolean() });
export const pushTokenSchema = z.object({
  token: z.string().refine((t) => Expo.isExpoPushToken(t), "Invalid Expo push token"),
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ user: req.user });
});

export const setAvailability = asyncHandler(async (req, res) => {
  req.user.isAvailable = req.body.isAvailable;
  await req.user.save();
  res.json({ user: req.user });
});

export const savePushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  // one device = one account: remove this token from anyone else who used it before
  await User.updateMany({ expoPushToken: token, _id: { $ne: req.user._id } }, { expoPushToken: null });
  req.user.expoPushToken = token;
  await req.user.save();
  res.json({ message: "Push token saved" });
});

// call this on logout so the device stops receiving this account's alerts
export const clearPushToken = asyncHandler(async (req, res) => {
  req.user.expoPushToken = null;
  await req.user.save();
  res.json({ message: "Push token removed" });
});
