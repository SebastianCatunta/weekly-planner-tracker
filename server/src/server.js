import { existsSync } from "node:fs";
import { createApp } from "./app.js";
import { connect } from "./db/connection.js";
import { ensureIndexes } from "./repositories/activityRepository.js";

if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.PORT) || 3001;

// The server starts even if MongoDB is off: requests then answer 503 DB_UNAVAILABLE, and the
// database is used again as soon as it is reachable.
try {
  await connect();
  await ensureIndexes();
} catch {
  console.warn("MongoDB is not available yet; requests will answer 503 until it is.");
}

createApp().listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
