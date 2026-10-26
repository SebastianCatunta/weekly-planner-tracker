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
