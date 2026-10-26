import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { connect, close, getDb } from "../../src/db/connection.js";
import { ensureIndexes } from "../../src/repositories/activityRepository.js";
import { startRealApp, body, postJson } from "./helpers.js";

// Needs a live MongoDB (MONGODB_URI). Uses its own throwaway database.
const live = { skip: !process.env.MONGODB_URI };
const testDatabase = `planner_api_test_${process.pid}_${Date.now()}`;
const stored = () => getDb().collection("activities").find({}).toArray();

let api;
before(async () => {
  if (live.skip) return;
  await connect({ database: testDatabase });
  await ensureIndexes();
  api = await startRealApp();
});
after(async () => {
  if (live.skip) return;
  await api.close();
  await getDb().dropDatabase();
  await close();
});
beforeEach(async () => {
  if (live.skip) return;
  await getDb().collection("activities").deleteMany({});
});

test("a valid POST answers 201 and the activity is stored in MongoDB", live, async () => {
  const res = await postJson(api, body({ name: "  Estudiar   inglés " }));
  assert.equal(res.status, 201);
  const { activity } = await res.json();
  assert.equal(activity.name, "Estudiar inglés");
  assert.equal(activity.start, "18:00");
  assert.equal(activity.endMinute, 1200);

  const docs = await stored();
  assert.equal(docs.length, 1);
  assert.equal(docs[0]._id.toString(), activity.id);
});

test("invalid fields answer 422 with all the details and store nothing", live, async () => {
  const res = await postJson(api, body({ name: "", end: "18:00" }));
  assert.equal(res.status, 422);
  assert.deepEqual(await res.json(), {
    error: {
      code: "VALIDATION_FAILED",
      details: [
        { code: "NAME_REQUIRED", fields: ["name"] },
        { code: "END_NOT_AFTER_START", fields: ["end"] },
      ],
    },
  });
  assert.equal((await stored()).length, 0);
});

test("a clash answers 409 OVERLAP with the conflicts", live, async () => {
  const first = await (await postJson(api, body())).json();
  const res = await postJson(api, body({ name: "Otra", start: "19:00", end: "21:00" }));
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), {
    error: {
      code: "OVERLAP",
      fields: ["day", "start", "end"],
      conflicts: [{ id: first.activity.id, name: "Estudiar", start: "18:00", end: "20:00" }],
    },
  });
  assert.equal((await stored()).length, 1);
});

test("an identical activity answers 409 DUPLICATE_OVERLAP", live, async () => {
  await postJson(api, body());
  const res = await postJson(api, body());
  assert.equal(res.status, 409);
  assert.equal((await res.json()).error.code, "DUPLICATE_OVERLAP");
  assert.equal((await stored()).length, 1);
});

test("a body with a key starting with $ answers 400 INVALID_BODY and stores nothing", live, async () => {
  const res = await postJson(api, body({ day: { $ne: "monday" } }));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: { code: "INVALID_BODY" } });
  assert.equal((await stored()).length, 0);
});

test("GET lists what was saved, ordered by day and start", live, async () => {
  await postJson(api, body({ name: "B", start: "10:00", end: "11:00" }));
  await postJson(api, body({ name: "C", day: "sunday", start: "08:00", end: "09:00" }));
  await postJson(api, body({ name: "A", start: "08:00", end: "09:00" }));

  const res = await api.request("/api/activities");
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).activities.map((a) => a.name), ["A", "B", "C"]);
});

test("GET with no data answers 200 and an empty list", live, async () => {
  const res = await api.request("/api/activities");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { activities: [] });
});

test("GET with an invalid stored document answers 500 DATA_CORRUPT", live, async () => {
  await getDb().collection("activities").insertOne({
    name: "Rota", category: "X", day: "monday", startMinute: 600, endMinute: 500, createdAt: new Date(),
  });
  const res = await api.request("/api/activities");
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: { code: "DATA_CORRUPT" } });
});

// T-25: cases sent straight to the API, without any interface in front.
test("a day that does not exist is rejected with 422 DAY_INVALID", live, async () => {
  const res = await postJson(api, body({ day: "funday" }));
  assert.equal(res.status, 422);
  assert.deepEqual((await res.json()).error.details, [{ code: "DAY_INVALID", fields: ["day"] }]);
  assert.equal((await stored()).length, 0);
});

test('the time "25:99" is rejected with 422 TIME_INVALID', live, async () => {
  const res = await postJson(api, body({ start: "25:99" }));
  assert.equal(res.status, 422);
  assert.deepEqual((await res.json()).error.details, [{ code: "TIME_INVALID", fields: ["start"] }]);
  assert.equal((await stored()).length, 0);
});

test("a name with <script> is rejected with 422 TEXT_NOT_ALLOWED", live, async () => {
  const res = await postJson(api, body({ name: "<script>alert(1)</script>" }));
  assert.equal(res.status, 422);
  assert.deepEqual((await res.json()).error.details, [{ code: "TEXT_NOT_ALLOWED", fields: ["name"] }]);
  assert.equal((await stored()).length, 0);
});

test("two simultaneous requests that clash leave only the first one saved", live, async () => {
  const [first, second] = await Promise.all([
    postJson(api, body({ name: "Primera", start: "10:00", end: "11:00" })),
    postJson(api, body({ name: "Segunda", start: "10:30", end: "11:30" })),
  ]);
  const statuses = [first.status, second.status].sort();
  assert.deepEqual(statuses, [201, 409]);

  const docs = await stored();
  assert.equal(docs.length, 1);
  // The saved one is the one that got the 201.
  const winner = first.status === 201 ? "Primera" : "Segunda";
  assert.equal(docs[0].name, winner);
});

test("two identical simultaneous requests leave one saved and the other DUPLICATE_OVERLAP", live, async () => {
  const [a, b] = await Promise.all([postJson(api, body()), postJson(api, body())]);
  const results = await Promise.all([a, b].map(async (r) => [r.status, (await r.json()).error?.code]));
  assert.deepEqual(results.map(([status]) => status).sort(), [201, 409]);
  assert.ok(results.some(([, code]) => code === "DUPLICATE_OVERLAP"));
  assert.equal((await stored()).length, 1);
});
