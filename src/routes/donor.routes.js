import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { searchDonors, getDonor, searchDonorsSchema } from "../controllers/donor.controller.js";

const router = Router();
router.use(protect); // phone numbers are only visible to logged-in users

router.get("/", validateQuery(searchDonorsSchema), searchDonors);
router.get("/:id", getDonor);
export default router;
