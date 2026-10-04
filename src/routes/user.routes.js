import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getMe, updateMe, setAvailability, savePushToken, clearPushToken,
  updateProfileSchema, availabilitySchema, pushTokenSchema,
} from "../controllers/user.controller.js";

const router = Router();
router.use(protect);

router.get("/me", getMe);
router.put("/me", validate(updateProfileSchema), updateMe);
router.patch("/me/availability", validate(availabilitySchema), setAvailability);
router.post("/me/push-token", validate(pushTokenSchema), savePushToken);
router.delete("/me/push-token", clearPushToken);
export default router;
