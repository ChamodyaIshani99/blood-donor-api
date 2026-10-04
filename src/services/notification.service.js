import { Expo } from "expo-server-sdk";
import User from "../models/User.js";
import { COMPATIBLE_DONORS, DONATION_GAP_DAYS } from "../config/constants.js";

const expo = new Expo();

// donors who can give to this patient, live in the same district,
// are available, eligible, and have a push token
export async function findMatchingDonors(request) {
  const cutoff = new Date(Date.now() - DONATION_GAP_DAYS * 24 * 60 * 60 * 1000);
  return User.find({
    _id: { $ne: request.requester },
    bloodGroup: { $in: COMPATIBLE_DONORS[request.bloodGroup] },
    district: request.district,
    isAvailable: true,
    expoPushToken: { $ne: null },
    $or: [{ lastDonationDate: null }, { lastDonationDate: { $lte: cutoff } }],
  }).select("expoPushToken");
}

// pure function (easy to unit test). Contact phone is NOT put in the push.
export function buildMessages(request, tokens) {
  const date = new Date(request.neededBy).toISOString().slice(0, 10);
  const title =
    request.urgency === "Normal"
      ? `${request.bloodGroup} blood needed`
      : `${request.urgency}: ${request.bloodGroup} blood needed`;
  const body = `${request.units} unit(s) at ${request.hospital}, ${request.district}. Needed by ${date}.`;

  return tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({
      to,
      sound: "default",
      title,
      body,
      priority: request.urgency === "Normal" ? "default" : "high",
      channelId: "blood-requests",
      data: { type: "blood_request", requestId: String(request._id) },
    }));
}

export async function notifyDonorsOfRequest(request) {
  const donors = await findMatchingDonors(request);
  const messages = buildMessages(request, donors.map((d) => d.expoPushToken));
  if (!messages.length) return { matched: 0, sent: 0, removed: 0 };

  let sent = 0;
  const staleTokens = [];

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === "ok") sent++;
        else if (ticket.details?.error === "DeviceNotRegistered") staleTokens.push(chunk[i].to);
      });
    } catch (err) {
      console.error("Push chunk failed:", err.message);
    }
  }

  // tokens that no longer work (app uninstalled etc.) -> clean up
  if (staleTokens.length) {
    await User.updateMany({ expoPushToken: { $in: staleTokens } }, { expoPushToken: null });
  }

  console.log(`Push for request ${request._id}: matched ${messages.length}, sent ${sent}, removed ${staleTokens.length}`);
  return { matched: messages.length, sent, removed: staleTokens.length };
}
