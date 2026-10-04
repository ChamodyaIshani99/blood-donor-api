import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import {
  createRequest, listRequests, myRequests, getRequest,
  updateRequest, setStatus, deleteRequest,
  createRequestSchema, updateRequestSchema, statusSchema,
  listRequestsSchema, mineSchema,
} from "../controllers/request.controller.js";

// stop spam: max 10 new requests per hour per IP
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests created, try again later" },
});

const router = Router();
router.use(protect);

router.get("/", validateQuery(listRequestsSchema), listRequests);
router.get("/mine", validateQuery(mineSchema), myRequests); // must be before /:id
router.post("/", createLimiter, validate(createRequestSchema), createRequest);

router.get("/:id", getRequest);
router.put("/:id", validate(updateRequestSchema), updateRequest);
router.patch("/:id/status", validate(statusSchema), setStatus);
router.delete("/:id", deleteRequest);

export default router;
