import test from "node:test";
import assert from "node:assert/strict";
import { COMPATIBLE_DONORS, BLOOD_GROUPS } from "../src/config/constants.js";
import { buildMessages } from "../src/services/notification.service.js";

test("every group can receive from its own group", () => {
  for (const g of BLOOD_GROUPS) assert.ok(COMPATIBLE_DONORS[g].includes(g));
});

test("O- is a universal donor and AB+ a universal recipient", () => {
  for (const g of BLOOD_GROUPS) assert.ok(COMPATIBLE_DONORS[g].includes("O-"), `${g} should accept O-`);
  assert.equal(COMPATIBLE_DONORS["AB+"].length, 8);
  assert.deepEqual(COMPATIBLE_DONORS["O-"], ["O-"]);
});

test("known incompatibilities are respected", () => {
  assert.ok(!COMPATIBLE_DONORS["A+"].includes("B+"));
  assert.ok(!COMPATIBLE_DONORS["O+"].includes("A+"));
  assert.ok(!COMPATIBLE_DONORS["B-"].includes("B+"));
});

const request = {
  _id: "64b0c0ffee0c0ffee0c0ffee",
  bloodGroup: "O+",
  units: 2,
  hospital: "National Hospital",
  district: "Colombo",
  urgency: "Critical",
  neededBy: new Date("2026-10-10T00:00:00Z"),
  contactPhone: "0771234567",
};

test("buildMessages skips invalid tokens and builds the payload", () => {
  const msgs = buildMessages(request, ["ExponentPushToken[abcdefghijklmnopqrstuv]", "not-a-token"]);
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].title, "Critical: O+ blood needed");
  assert.equal(msgs[0].priority, "high");
  assert.equal(msgs[0].data.requestId, "64b0c0ffee0c0ffee0c0ffee");
  assert.match(msgs[0].body, /2 unit\(s\) at National Hospital, Colombo. Needed by 2026-10-10/);
});

test("push never contains the contact phone number", () => {
  const [m] = buildMessages(request, ["ExponentPushToken[abcdefghijklmnopqrstuv]"]);
  assert.ok(!JSON.stringify(m).includes("0771234567"));
});

test("normal urgency has a plain title and default priority", () => {
  const [m] = buildMessages({ ...request, urgency: "Normal" }, ["ExponentPushToken[abcdefghijklmnopqrstuv]"]);
  assert.equal(m.title, "O+ blood needed");
  assert.equal(m.priority, "default");
});
