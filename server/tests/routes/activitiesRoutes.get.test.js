import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createActivitiesRouter } from "../../src/routes/activitiesRoutes.js";
import { startApp } from "./helpers.js";

let result;
let api;
const service = { listActivities: async () => result };

before(async () => {
  api = await startApp({ routers: [["/api", createActivitiesRouter(service)]] });
});
after(() => api.close());

const dto = (id, name) => ({
  id, name, category: "Estudio", day: "monday", start: "18:00", end: "20:00", startMinute: 1080, endMinute: 1200,
});

test("with data answers 200 { activities } in the service's order", async () => {
  result = { ok: true, activities: [dto("1", "A"), dto("2", "B")] };
  const res = await api.request("/api/activities");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { activities: result.activities });
});

test("with no data answers 200 and an empty list", async () => {
  result = { ok: true, activities: [] };
  const res = await api.request("/api/activities");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { activities: [] });
});

test("with MongoDB off answers 503 DB_UNAVAILABLE", async () => {
  result = { ok: false, code: "DB_UNAVAILABLE" };
  const res = await api.request("/api/activities");
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: { code: "DB_UNAVAILABLE" } });
});

test("with an invalid stored document answers 500 DATA_CORRUPT and no partial list", async () => {
  result = { ok: false, code: "DATA_CORRUPT" };
  const res = await api.request("/api/activities");
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: { code: "DATA_CORRUPT" } });
});

test("an unexpected service code answers 500 INTERNAL", async () => {
  result = { ok: false, code: "INTERNAL" };
  const res = await api.request("/api/activities");
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: { code: "INTERNAL" } });
});
