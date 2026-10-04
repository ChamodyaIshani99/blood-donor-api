import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import requestRoutes from "./routes/request.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// limit brute-force on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, try again later" },
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
