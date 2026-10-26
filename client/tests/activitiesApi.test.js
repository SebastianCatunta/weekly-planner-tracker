import { test } from "node:test";
import assert from "node:assert/strict";
import { getActivities, createActivity } from "../src/api/activitiesApi.js";

const json = (status, body) => async () => new Response(JSON.stringify(body), { status });
const activity = { id: "1", name: "Estudiar", day: "monday", start: "18:00", end: "20:00", startMinute: 1080, endMinute: 1200 };

test("getActivities returns the list as success data", async () => {
  const result = await getActivities({ fetchImpl: json(200, { activities: [activity] }) });
  assert.deepEqual(result, { ok: true, data: [activity] });
});

test("createActivity sends a JSON POST and returns the saved activity", async () => {
  let call;
  const fetchImpl = async (path, init) => {
    call = { path, init };
    return new Response(JSON.stringify({ activity }), { status: 201 });
  };
  const input = { name: "Estudiar", category: "Estudio", day: "monday", start: "18:00", end: "20:00" };

  const result = await createActivity(input, { fetchImpl });

  assert.deepEqual(result, { ok: true, data: activity });
  assert.equal(call.path, "/api/activities");
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(call.init.body), input);
});

test("a 422 keeps the code and all the details", async () => {
  const details = [{ code: "NAME_REQUIRED", fields: ["name"] }, { code: "END_NOT_AFTER_START", fields: ["end"] }];
  const result = await createActivity({}, { fetchImpl: json(422, { error: { code: "VALIDATION_FAILED", details } }) });
  assert.deepEqual(result, { ok: false, code: "VALIDATION_FAILED", details, fields: [], conflicts: [] });
});

test("a 409 keeps the code, the fields and the conflicts", async () => {
  const conflicts = [{ id: "9", name: "Leer", start: "18:00", end: "19:00" }];
  const error = { code: "OVERLAP", fields: ["day", "start", "end"], conflicts };
  const result = await createActivity({}, { fetchImpl: json(409, { error }) });
  assert.deepEqual(result, { ok: false, code: "OVERLAP", details: [], fields: ["day", "start", "end"], conflicts });
});

test("a server error code is passed through", async () => {
  assert.equal((await getActivities({ fetchImpl: json(503, { error: { code: "DB_UNAVAILABLE" } }) })).code, "DB_UNAVAILABLE");
  assert.equal((await getActivities({ fetchImpl: json(500, { error: { code: "DATA_CORRUPT" } }) })).code, "DATA_CORRUPT");
});

test("a network failure becomes DB_UNAVAILABLE, for both calls", async () => {
  const fetchImpl = async () => {
    throw new TypeError("Failed to fetch");
  };
  const expected = { ok: false, code: "DB_UNAVAILABLE", details: [], fields: [], conflicts: [] };
  assert.deepEqual(await getActivities({ fetchImpl }), expected);
  assert.deepEqual(await createActivity({}, { fetchImpl }), expected);
});

test("an answer that is not JSON, or has an unexpected shape, becomes INTERNAL", async () => {
  const html = async () => new Response("<html>Bad gateway</html>", { status: 502 });
  assert.equal((await getActivities({ fetchImpl: html })).code, "INTERNAL");
  assert.equal((await createActivity({}, { fetchImpl: html })).code, "INTERNAL");
  assert.equal((await getActivities({ fetchImpl: json(200, { other: 1 }) })).code, "INTERNAL");
  assert.equal((await createActivity({}, { fetchImpl: json(201, {}) })).code, "INTERNAL");
});
