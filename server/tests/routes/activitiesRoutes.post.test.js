import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createActivitiesRouter } from "../../src/routes/activitiesRoutes.js";
import { startApp } from "./helpers.js";

let result;
let received;
const service = {
  createActivity: async (input) => {
    received = input;
    return result;
  },
};

let api;
before(async () => {
  api = await startApp({ routers: [["/api", createActivitiesRouter(service)]] });
});
after(() => api.close());

const post = (body) =>
  api.request("/api/activities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const body = { name: "Estudiar", category: "Estudio", day: "monday", start: "18:00", end: "20:00" };
const activity = { id: "1", ...body, startMinute: 1080, endMinute: 1200 };

test("a saved activity answers 201 { activity } and passes the body to the service untouched", async () => {
  result = { ok: true, activity };
  const res = await post(body);
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { activity });
  assert.deepEqual(received, body);
});

test("invalid fields answer 422 with all the details", async () => {
  const details = [
    { code: "NAME_REQUIRED", fields: ["name"] },
    { code: "END_NOT_AFTER_START", fields: ["end"] },
  ];
  result = { ok: false, code: "VALIDATION_FAILED", details };
  const res = await post({});
  assert.equal(res.status, 422);
  assert.deepEqual(await res.json(), { error: { code: "VALIDATION_FAILED", details } });
});

test("a clash answers 409 OVERLAP with fields and conflicts", async () => {
  const conflicts = [{ id: "9", name: "Estudiar", start: "18:00", end: "20:00" }];
  result = { ok: false, code: "OVERLAP", fields: ["day", "start", "end"], conflicts };
  const res = await post(body);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: { code: "OVERLAP", fields: ["day", "start", "end"], conflicts } });
});

test("an identical activity answers 409 DUPLICATE_OVERLAP", async () => {
  result = { ok: false, code: "DUPLICATE_OVERLAP", fields: ["day", "start", "end"], conflicts: [] };
  const res = await post(body);
  assert.equal(res.status, 409);
  assert.equal((await res.json()).error.code, "DUPLICATE_OVERLAP");
});

test("MongoDB off answers 503 DB_UNAVAILABLE", async () => {
  result = { ok: false, code: "DB_UNAVAILABLE" };
  const res = await post(body);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: { code: "DB_UNAVAILABLE" } });
});

test("a body with a key starting with $ is rejected with 400 INVALID_BODY and never reaches the service", async () => {
  result = { ok: true, activity };
  received = undefined;
  for (const bad of [
    { ...body, day: { $ne: "monday" } },
    { ...body, $where: "1" },
    { ...body, nested: { deep: [{ $gt: "" }] } },
  ]) {
    const res = await post(bad);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: { code: "INVALID_BODY" } });
  }
  assert.equal(received, undefined);
});

test("a $ inside a value (not a key) is not an operator and reaches the service", async () => {
  result = { ok: false, code: "VALIDATION_FAILED", details: [{ code: "TEXT_NOT_ALLOWED", fields: ["name"] }] };
  const res = await post({ ...body, name: "$ne" });
  assert.equal(res.status, 422);
});

test("an empty body reaches the service as empty and answers its validation result", async () => {
  result = { ok: false, code: "VALIDATION_FAILED", details: [{ code: "NAME_REQUIRED", fields: ["name"] }] };
  const res = await api.request("/api/activities", { method: "POST" });
  assert.equal(res.status, 422);
});
