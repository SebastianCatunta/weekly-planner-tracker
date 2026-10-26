import { existsSync } from "node:fs";
import { createApp } from "./app.js";
import { connect } from "./db/connection.js";
import * as repository from "./repositories/activityRepository.js";
import { createActivityService } from "./services/activityService.js";
import { createActivitiesRouter } from "./routes/activitiesRoutes.js";
import { createEventsRouter } from "./routes/eventsRoutes.js";
import { createEventHub } from "./events/eventHub.js";

if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.PORT) || 3001;

// The server starts even if MongoDB is off: requests then answer 503 DB_UNAVAILABLE, and the
// database is used again as soon as it is reachable.
try {
  await connect();
  await repository.ensureIndexes();
} catch {
  console.warn("MongoDB is not available yet; requests will answer 503 until it is.");
}

// One service for the whole process, so every request shares the same write queue.
const activityService = createActivityService({ repository });

const eventHub = createEventHub();

createApp({
  routers: [
    ["/api", createActivitiesRouter(activityService)],
    ["/api", createEventsRouter(eventHub)],
  ],
}).listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
