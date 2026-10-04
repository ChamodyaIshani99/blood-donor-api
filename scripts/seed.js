// Fills the DB with sample donors + requests for testing.  Run: npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import BloodRequest from "../src/models/BloodRequest.js";
import { BLOOD_GROUPS } from "../src/config/constants.js";

const districts = ["Colombo", "Gampaha", "Kalutara", "Kandy"];
const areas = ["Maharagama", "Negombo", "Horana", "Peradeniya"];
const names = [
  "Nimal Perera", "Kasun Silva", "Dilini Fernando", "Sanduni Jayasinghe",
  "Tharindu Bandara", "Nadeesha Wickrama", "Chamara Rathnayake", "Hiruni Gunasekara",
  "Pasindu Madushan", "Ishara Weerasinghe", "Lakmal Dias", "Amaya Kumari",
];

await mongoose.connect(process.env.MONGO_URI);

const old = await User.find({ email: /@seed\.test$/ }).select("_id");
await BloodRequest.deleteMany({ requester: { $in: old.map((u) => u._id) } });
await User.deleteMany({ email: /@seed\.test$/ });

const passwordHash = await User.hashPassword("password123");
const users = [];
for (let i = 0; i < names.length; i++) {
  users.push({
    name: names[i],
    phone: `07700000${String(i + 1).padStart(2, "0")}`,
    email: `donor${i + 1}@seed.test`,
    passwordHash,
    bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
    district: districts[i % districts.length],
    area: areas[i % areas.length],
    isAvailable: i % 5 !== 0,                                   // some unavailable
    lastDonationDate: i % 4 === 0 ? new Date(Date.now() - 20 * 864e5) : null, // some not eligible yet
    showPhone: i % 6 !== 5,                                     // some hide phone
  });
}
const created = await User.insertMany(users);

await BloodRequest.create([
  {
    requester: created[1]._id, bloodGroup: "O+", units: 2, hospital: "National Hospital",
    district: "Colombo", urgency: "Critical", neededBy: new Date(Date.now() + 2 * 864e5),
    contactPhone: created[1].phone, note: "Surgery tomorrow morning",
  },
  {
    requester: created[2]._id, bloodGroup: "A+", units: 1, hospital: "Kalubowila Teaching Hospital",
    district: "Colombo", urgency: "Normal", neededBy: new Date(Date.now() + 7 * 864e5),
    contactPhone: created[2].phone,
  },
]);

console.log(`Seeded ${created.length} users and 2 requests.`);
console.log("Login with donor1@seed.test ... donor12@seed.test, password: password123");
await mongoose.disconnect();
