import { createActivityService } from "../../src/services/activityService.js";
import * as repository from "../../src/repositories/activityRepository.js";
import { createActivitiesRouter } from "../../src/routes/activitiesRoutes.js";
import { startApp } from "../routes/helpers.js";

// The real app: real routes, real service, real repository. Only the database name changes.
export function startRealApp() {
  const service = createActivityService({ repository });
  return startApp({ routers: [["/api", createActivitiesRouter(service)]] });
}

export const body = (overrides = {}) => ({
  name: "Estudiar",
  category: "Estudio",
  day: "monday",
  start: "18:00",
  end: "20:00",
  ...overrides,
});

export const postJson = (api, payload) =>
  api.request("/api/activities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
