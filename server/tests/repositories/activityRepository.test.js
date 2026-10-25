import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { connect, close, getDb } from "../../src/db/connection.js";
import { DatabaseUnavailableError } from "../../src/db/errors.js";
import { ensureIndexes, insert, findByDay } from "../../src/repositories/activityRepository.js";

const activity = (overrides = {}) => ({
  name: "Estudiar",
  category: "Estudio",
  day: "monday",
  startMinute: 1080,
  endMinute: 1200,
  ...overrides,
});

// MongoDB off: no connection has been made yet in this process, so every operation must fail
// with the own error and never with a driver error.
test("insert and findByDay throw DatabaseUnavailableError with MongoDB off", async () => {
  await assert.rejects(insert(activity()), DatabaseUnavailableError);
  await assert.rejects(findByDay("monday"), DatabaseUnavailableError);
  await assert.rejects(ensureIndexes(), DatabaseUnavailableError);
});

// The tests below need a live MongoDB (MONGODB_URI). They use their own throwaway database.
const live = { skip: !process.env.MONGODB_URI };
const testDatabase = `planner_test_${process.pid}_${Date.now()}`;

before(async () => {
  if (live.skip) return;
  await connect({ database: testDatabase });
  await ensureIndexes();
});

after(async () => {
  if (live.skip) return;
  await getDb().dropDatabase();
  await close();
});

beforeEach(async () => {
  if (live.skip) return;
  await getDb().collection("activities").deleteMany({});
});

test("insert stores the plan's fields and no user or week field", live, async () => {
  const saved = await insert(activity());
  assert.equal(typeof saved.id, "string");
  assert.ok(saved.createdAt instanceof Date);

  const doc = await getDb().collection("activities").findOne({});
  assert.deepEqual(
    Object.keys(doc).sort(),
    ["_id", "category", "createdAt", "day", "endMinute", "name", "startMinute"],
  );
});

test("findByDay returns only the activities of that day, ordered by start", live, async () => {
  await insert(activity({ name: "B", startMinute: 600, endMinute: 660 }));
  await insert(activity({ name: "A", startMinute: 60, endMinute: 120 }));
  await insert(activity({ name: "C", day: "tuesday" }));

  const monday = await findByDay("monday");
  assert.deepEqual(monday.map((a) => a.name), ["A", "B"]);
  assert.deepEqual(await findByDay("friday"), []);
});

test("the index { day: 1, startMinute: 1 } exists", live, async () => {
  const indexes = await getDb().collection("activities").indexes();
  assert.ok(indexes.some((i) => JSON.stringify(i.key) === JSON.stringify({ day: 1, startMinute: 1 })));
});

test("a value containing $ne is searched as literal text", live, async () => {
  await insert(activity());
  assert.deepEqual(await findByDay("$ne"), []);
  assert.deepEqual(await findByDay({ $ne: "monday" }), []);
  assert.equal((await findByDay("monday")).length, 1);
});
