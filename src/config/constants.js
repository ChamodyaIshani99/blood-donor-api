export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

export const URGENCY_LEVELS = ["Normal", "Urgent", "Critical"];
export const REQUEST_STATUSES = ["open", "fulfilled", "expired"];

// Days a donor must wait after donating (keep configurable)
export const DONATION_GAP_DAYS = 90;

// patient blood group -> donor groups that can give to them
export const COMPATIBLE_DONORS = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

// Sri Lankan mobile: 07XXXXXXXX or +947XXXXXXXX
export const PHONE_REGEX = /^(?:0|\+94)7\d{8}$/;

// used to sort requests: Critical first
export const URGENCY_RANK = { Normal: 1, Urgent: 2, Critical: 3 };
