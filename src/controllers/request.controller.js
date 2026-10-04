import { z } from "zod";
import BloodRequest from "../models/BloodRequest.js";
import {
  BLOOD_GROUPS, DISTRICTS, URGENCY_LEVELS, REQUEST_STATUSES, PHONE_REGEX,
} from "../config/constants.js";
import { ApiError, asyncHandler } from "../utils/asyncHandler.js";
import { paginationShape, pageMeta } from "../utils/paginate.js";
import { startOfToday } from "../utils/dates.js";
import { notifyDonorsOfRequest } from "../services/notification.service.js";

const bloodGroupParam = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/ /g, "+") : v),
  z.enum(BLOOD_GROUPS)
);

/* ---------- schemas ---------- */

export const createRequestSchema = z.object({
  patientName: z.string().trim().max(80).optional().default(""),
  bloodGroup: z.enum(BLOOD_GROUPS),
  units: z.coerce.number().int().min(1).max(10).default(1),
  hospital: z.string().trim().min(2, "Hospital name is too short").max(120),
  district: z.enum(DISTRICTS),
  urgency: z.enum(URGENCY_LEVELS).default("Normal"),
  neededBy: z.coerce
    .date()
    .refine((d) => d >= startOfToday(), "Needed-by date cannot be in the past"),
  contactPhone: z.string().regex(PHONE_REGEX, "Enter a valid mobile number (07XXXXXXXX)"),
  note: z.string().trim().max(500).optional().default(""),
});

export const updateRequestSchema = createRequestSchema.partial();

export const statusSchema = z.object({ status: z.enum(["open", "fulfilled"]) });

export const listRequestsSchema = z.object({
  bloodGroup: bloodGroupParam.optional(),
  district: z.enum(DISTRICTS).optional(),
  urgency: z.enum(URGENCY_LEVELS).optional(),
  status: z.enum(REQUEST_STATUSES).default("open"),
  ...paginationShape,
});

export const mineSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  ...paginationShape,
});

/* ---------- helpers ---------- */

const findOwned = async (req) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Request not found");
  if (!request.requester.equals(req.user._id)) {
    throw new ApiError(403, "You can only modify your own requests");
  }
  return request;
};

/* ---------- handlers ---------- */

export const createRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.create({ ...req.body, requester: req.user._id });

  res.status(201).json({ request });

  // fire-and-forget: the response is already sent, a push failure must not break it
  notifyDonorsOfRequest(request).catch((err) => console.error("Notify failed:", err.message));
});

export const listRequests = asyncHandler(async (req, res) => {
  const { bloodGroup, district, urgency, status, page, limit } = req.query;

  const filter = { status };
  if (status === "open") filter.neededBy = { $gte: startOfToday() };
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (district) filter.district = district;
  if (urgency) filter.urgency = urgency;

  const [requests, total] = await Promise.all([
    BloodRequest.find(filter)
      .populate("requester", "name")
      .sort({ urgencyRank: -1, neededBy: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BloodRequest.countDocuments(filter),
  ]);

  res.json({ requests, meta: pageMeta(page, limit, total) });
});

export const myRequests = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;

  const filter = { requester: req.user._id };
  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BloodRequest.countDocuments(filter),
  ]);

  res.json({ requests, meta: pageMeta(page, limit, total) });
});

export const getRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id).populate("requester", "name");
  if (!request) throw new ApiError(404, "Request not found");
  res.json({ request });
});

export const updateRequest = asyncHandler(async (req, res) => {
  const request = await findOwned(req);
  if (request.status !== "open") {
    throw new ApiError(400, "Only open requests can be edited");
  }
  Object.assign(request, req.body);
  await request.save();
  res.json({ request });
});

export const setStatus = asyncHandler(async (req, res) => {
  const request = await findOwned(req);
  const { status } = req.body;

  if (status === "open" && request.neededBy < startOfToday()) {
    throw new ApiError(400, "Update the needed-by date before reopening this request");
  }
  request.status = status;
  await request.save();
  res.json({ request });
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const request = await findOwned(req);
  await request.deleteOne();
  res.json({ message: "Request deleted" });
});
