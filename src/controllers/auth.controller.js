import { z } from "zod";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { BLOOD_GROUPS, DISTRICTS, PHONE_REGEX } from "../config/constants.js";
import { ApiError, asyncHandler } from "../utils/asyncHandler.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().regex(PHONE_REGEX, "Enter a valid mobile number (07XXXXXXXX)"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bloodGroup: z.enum(BLOOD_GROUPS),
  district: z.enum(DISTRICTS),
  area: z.string().trim().max(60).optional().default(""),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const register = asyncHandler(async (req, res) => {
  const { password, ...data } = req.body;
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ ...data, passwordHash });
  res.status(201).json({ token: signToken(user._id), user });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }
  res.json({ token: signToken(user._id), user });
});
