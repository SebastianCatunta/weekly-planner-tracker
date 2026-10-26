import { test } from "node:test";
import assert from "node:assert/strict";
import { createActivityService } from "../../src/services/activityService.js";
import { createFakeRepository } from "./fakeRepository.js";

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
