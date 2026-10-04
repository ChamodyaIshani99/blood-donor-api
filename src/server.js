import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { expireOldRequests } from "./utils/expireRequests.js";

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in .env");
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));

    // mark old open requests as expired now, then every hour
    const run = () => expireOldRequests().catch((e) => console.error("Expire job failed:", e.message));
    run();
    setInterval(run, 60 * 60 * 1000);
  })
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
