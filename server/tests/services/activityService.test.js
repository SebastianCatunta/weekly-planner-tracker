import { test } from "node:test";
import assert from "node:assert/strict";
import { createActivityService } from "../../src/services/activityService.js";
import { createFakeRepository } from "./fakeRepository.js";
import { DatabaseUnavailableError, DataCorruptError } from "../../src/db/errors.js";

const valid = { name: "Estudiar", category: "Estudio", day: "monday", start: "18:00", end: "20:00" };

test("invalid data returns VALIDATION_FAILED with all the details", async () => {
  const repository = createFakeRepository();
  const service = createActivityService({ repository });

  const result = await service.createActivity({ ...valid, name: "  ", end: "18:00" });

  assert.equal(result.ok, false);
  assert.equal(result.code, "VALIDATION_FAILED");
  assert.deepEqual(result.details, [
    { code: "NAME_REQUIRED", fields: ["name"] },
    { code: "END_NOT_AFTER_START", fields: ["end"] },
  ]);
});

test("invalid data never calls the repository", async () => {
  const repository = createFakeRepository();
  const service = createActivityService({ repository });

  await service.createActivity({});
  await service.createActivity(undefined);
  await service.createActivity({ ...valid, day: "funday" });

  assert.deepEqual(repository.calls, []);
});

const seed = (repository, overrides = {}) =>
  repository.insert({
    name: "Estudiar",
    category: "Estudio",
    day: "monday",
    startMinute: 1080,
    endMinute: 1200,
    ...overrides,
  });

test("an overlap returns OVERLAP with the complete list of conflicts", async () => {
  const repository = createFakeRepository();
  await seed(repository, { name: "A", startMinute: 1000, endMinute: 1100 });
  await seed(repository, { name: "B", startMinute: 1150, endMinute: 1300 });
  await seed(repository, { name: "C", startMinute: 1300, endMinute: 1400 });
  repository.calls.length = 0;
  const service = createActivityService({ repository });

  const result = await service.createActivity(valid);

  assert.equal(result.ok, false);
  assert.equal(result.code, "OVERLAP");
  assert.deepEqual(result.fields, ["day", "start", "end"]);
  assert.deepEqual(result.conflicts, [
    { id: "1", name: "A", start: "16:40", end: "18:20" },
    { id: "2", name: "B", start: "19:10", end: "21:40" },
  ]);
  assert.equal(repository.calls.some(([name]) => name === "insert"), false);
});

test("an identical activity returns DUPLICATE_OVERLAP", async () => {
  const repository = createFakeRepository();
  await seed(repository);
  const service = createActivityService({ repository });

  const result = await service.createActivity(valid);

  assert.equal(result.code, "DUPLICATE_OVERLAP");
  assert.deepEqual(result.fields, ["day", "start", "end"]);
  assert.equal(result.conflicts.length, 1);
});

test("touching at one end is not a conflict, and other days never conflict", async () => {
  const repository = createFakeRepository();
  await seed(repository, { startMinute: 1200, endMinute: 1260 });
  await seed(repository, { day: "tuesday" });
  const service = createActivityService({ repository });

  const result = await service.createActivity(valid);

  assert.equal(result.ok, true);
});

test("two overlapping registrations sent at once leave only the first one saved", async () => {
  const repository = createFakeRepository({ delayMs: 20 });
  const service = createActivityService({ repository });

  const [first, second] = await Promise.all([
    service.createActivity({ ...valid, name: "Primera", start: "10:00", end: "11:00" }),
    service.createActivity({ ...valid, name: "Segunda", start: "10:30", end: "11:30" }),
  ]);

  assert.equal(first.ok, true);
  assert.equal(second.code, "OVERLAP");
  assert.deepEqual(repository.stored.map((a) => a.name), ["Primera"]);
});

test("two identical submissions in a row leave one saved and the second is DUPLICATE_OVERLAP", async () => {
  const repository = createFakeRepository({ delayMs: 20 });
  const service = createActivityService({ repository });

  const [first, second] = await Promise.all([service.createActivity(valid), service.createActivity(valid)]);

  assert.equal(first.ok, true);
  assert.equal(second.code, "DUPLICATE_OVERLAP");
  assert.equal(repository.stored.length, 1);
});

test("the order is fields, then conflicts, then saving", async () => {
  const repository = createFakeRepository();
  await seed(repository);
  repository.calls.length = 0;
  const service = createActivityService({ repository });

  // Invalid fields win over a conflict: the repository is not even read.
  const invalid = await service.createActivity({ ...valid, name: "" });
  assert.equal(invalid.code, "VALIDATION_FAILED");
  assert.deepEqual(repository.calls, []);

  // A conflict wins over saving: the day is read, nothing is inserted.
  await service.createActivity(valid);
  assert.deepEqual(repository.calls.map(([name]) => name), ["findByDay"]);

  // Valid and free: read, then insert.
  repository.calls.length = 0;
  await service.createActivity({ ...valid, start: "08:00", end: "09:00" });
  assert.deepEqual(repository.calls.map(([name]) => name), ["findByDay", "insert"]);
});

test("a valid registration returns the activity as an ActivityDto", async () => {
  const repository = createFakeRepository();
  const service = createActivityService({ repository });

  const result = await service.createActivity({ ...valid, name: "  Estudiar   inglés " });

  assert.equal(result.ok, true);
  assert.deepEqual(result.activity, {
    id: "1",
    name: "Estudiar inglés",
    category: "Estudio",
    day: "monday",
    start: "18:00",
    end: "20:00",
    startMinute: 1080,
    endMinute: 1200,
  });
  assert.equal(repository.stored.length, 1);
});

test("an activity that ends at the end of the day shows end 00:00", async () => {
  const service = createActivityService({ repository: createFakeRepository() });

  const result = await service.createActivity({ ...valid, day: "sunday", start: "23:00", end: "00:00" });

  assert.equal(result.activity.end, "00:00");
  assert.equal(result.activity.startMinute, 1380);
  assert.equal(result.activity.endMinute, 1440);
});

test("DatabaseUnavailableError becomes DB_UNAVAILABLE and nothing is saved", async () => {
  const repository = createFakeRepository({ failWith: new DatabaseUnavailableError() });
  const service = createActivityService({ repository });

  const result = await service.createActivity(valid);

  assert.deepEqual(result, { ok: false, code: "DB_UNAVAILABLE" });
  assert.equal(repository.stored.length, 0);
});

test("a database failure while saving leaves nothing stored and the next request still works", async () => {
  const repository = createFakeRepository();
  const insert = repository.insert;
  let fail = true;
  repository.insert = async (activity) => {
    if (fail) throw new DatabaseUnavailableError();
    return insert(activity);
  };
  const service = createActivityService({ repository });

  assert.equal((await service.createActivity(valid)).code, "DB_UNAVAILABLE");
  assert.equal(repository.stored.length, 0);

  fail = false;
  assert.equal((await service.createActivity(valid)).ok, true);
});

test("unexpected failures return INTERNAL without leaking the error", async () => {
  const repository = createFakeRepository({ failWith: new TypeError("secret detail") });
  const service = createActivityService({ repository });

  const result = await service.createActivity(valid);

  assert.deepEqual(result, { ok: false, code: "INTERNAL" });
});

test("listActivities returns every activity as an ActivityDto, in the repository's order", async () => {
  const repository = createFakeRepository();
  await seed(repository, { name: "A", startMinute: 60, endMinute: 120 });
  await seed(repository, { name: "B", day: "sunday", startMinute: 1380, endMinute: 1440 });
  const service = createActivityService({ repository });

  const result = await service.listActivities();

  assert.equal(result.ok, true);
  assert.deepEqual(result.activities.map((a) => [a.id, a.name, a.start, a.end]), [
    ["1", "A", "01:00", "02:00"],
    ["2", "B", "23:00", "00:00"],
  ]);
  assert.deepEqual(Object.keys(result.activities[0]).sort(), [
    "category", "day", "end", "endMinute", "id", "name", "start", "startMinute",
  ]);
});

test("listActivities with no data returns an empty list", async () => {
  const service = createActivityService({ repository: createFakeRepository() });
  assert.deepEqual(await service.listActivities(), { ok: true, activities: [] });
});

test("listActivities propagates DB_UNAVAILABLE and DATA_CORRUPT without a partial list", async () => {
  const unavailable = createActivityService({
    repository: createFakeRepository({ failWith: new DatabaseUnavailableError() }),
  });
  assert.deepEqual(await unavailable.listActivities(), { ok: false, code: "DB_UNAVAILABLE" });

  const corrupt = createActivityService({
    repository: createFakeRepository({ failWith: new DataCorruptError() }),
  });
  assert.deepEqual(await corrupt.listActivities(), { ok: false, code: "DATA_CORRUPT" });
});

test("listActivities returns INTERNAL for unexpected failures", async () => {
  const service = createActivityService({
    repository: createFakeRepository({ failWith: new Error("x") }),
  });
  assert.deepEqual(await service.listActivities(), { ok: false, code: "INTERNAL" });
});
