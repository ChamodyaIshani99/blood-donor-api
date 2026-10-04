import BloodRequest from "../models/BloodRequest.js";
import { startOfToday } from "./dates.js";

// open requests whose needed-by date has passed -> "expired"
export async function expireOldRequests() {
  const res = await BloodRequest.updateMany(
    { status: "open", neededBy: { $lt: startOfToday() } },
    { status: "expired" }
  );
  if (res.modifiedCount) console.log(`Expired ${res.modifiedCount} old request(s)`);
}
