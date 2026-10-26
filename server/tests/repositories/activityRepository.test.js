import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { connect, close, getDb } from "../../src/db/connection.js";
import { DataCorruptError } from "../../src/db/errors.js";
import {
  ensureIndexes,
  insert,
  findByDay,
  findAll,
  parseStoredActivities,
} from "../../src/repositories/activityRepository.js";

const activity = (overrides = {}) => ({
  name: "Estudiar",
  category: "Estudio",
  day: "monday",
  startMinute: 1080,
  endMinute: 1200,
  ...overrides,
});

const storedDoc = (overrides = {}) => ({
  _id: { toString: () => "1" },
  createdAt: new Date(),
  ...activity(),
  ...overrides,
});

test("parseStoredActivities orders by day of the week and then by start", () => {
  const list = parseStoredActivities([
    storedDoc({ name: "C", day: "sunday", startMinute: 0, endMinute: 60 }),
    storedDoc({ name: "B", day: "monday", startMinute: 600, endMinute: 660 }),
    storedDoc({ name: "A", day: "monday", startMinute: 60, endMinute: 120 }),
    storedDoc({ name: "D", day: "friday", startMinute: 0, endMinute: 1440 }),
  ]);
  assert.deepEqual(list.map((a) => a.name), ["A", "B", "D", "C"]);
});

test("parseStoredActivities throws DATA_CORRUPT for any invalid document", () => {
  const invalid = [
    { endMinute: 500, startMinute: 600 },
    { endMinute: 600, startMinute: 600 },
    { endMinute: 0 },
    { endMinute: 1500 },
    { startMinute: -1 },
    { startMinute: "600" },
    { day: "funday" },
    { name: "" },
    { name: "x".repeat(31) },
    { category: 5 },
  ];
  for (const overrides of invalid) {
    assert.throws(
      () => parseStoredActivities([storedDoc(), storedDoc(overrides)]),
      (error) => error instanceof DataCorruptError && error.code === "DATA_CORRUPT",
      JSON.stringify(overrides),
    );
  }
});

test("parseStoredActivities accepts an activity that ends at the end of the day", () => {
  assert.equal(parseStoredActivities([storedDoc({ startMinute: 1380, endMinute: 1440 })]).length, 1);
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

test("findAll returns everything ordered by day and start", live, async () => {
  await insert(activity({ name: "C", day: "sunday", startMinute: 0, endMinute: 60 }));
  await insert(activity({ name: "B", startMinute: 600, endMinute: 660 }));
  await insert(activity({ name: "A", startMinute: 60, endMinute: 120 }));
  assert.deepEqual((await findAll()).map((a) => a.name), ["A", "B", "C"]);
});

test("findAll throws DATA_CORRUPT when a document was altered by hand", live, async () => {
  await insert(activity());
  await getDb().collection("activities").insertOne({ ...activity(), startMinute: 600, endMinute: 500 });
  await assert.rejects(findAll(), DataCorruptError);
});
