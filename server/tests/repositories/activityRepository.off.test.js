import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseUnavailableError } from "../../src/db/errors.js";
import { ensureIndexes, insert, findByDay, findAll } from "../../src/repositories/activityRepository.js";

// Own file on purpose: each test file runs in its own process, so no connection exists here even
// when MONGODB_URI is set.
const activity = {
  name: "Estudiar",
  category: "Estudio",
  day: "monday",
  startMinute: 1080,
  endMinute: 1200,
};

// MongoDB off: no connection has been made yet in this process, so every operation must fail
// with the own error and never with a driver error.
test("insert and findByDay throw DatabaseUnavailableError with MongoDB off", async () => {
  await assert.rejects(insert(activity), DatabaseUnavailableError);
  await assert.rejects(findByDay("monday"), DatabaseUnavailableError);
  await assert.rejects(findAll(), DatabaseUnavailableError);
  await assert.rejects(ensureIndexes(), DatabaseUnavailableError);
});
