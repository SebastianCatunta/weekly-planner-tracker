import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTextField, validateSchedule } from "../../src/core/validateActivity.js";

// ---- Name and category (T-06) ----

test("001/RF-3.2 validateTextField reports NAME_REQUIRED and CATEGORY_REQUIRED when empty after normalizing", () => {
  assert.deepEqual(validateTextField("name", "   ").errors, [{ code: "NAME_REQUIRED", fields: ["name"] }]);
  assert.deepEqual(validateTextField("category", "").errors, [{ code: "CATEGORY_REQUIRED", fields: ["category"] }]);
  assert.deepEqual(validateTextField("name", undefined).errors, [{ code: "NAME_REQUIRED", fields: ["name"] }]);
});

test("001/RF-3.6 validateTextField accepts 30 characters and rejects 31", () => {
  assert.deepEqual(validateTextField("name", "a".repeat(30)).errors, []);
  assert.deepEqual(validateTextField("name", "a".repeat(31)).errors, [{ code: "NAME_TOO_LONG", fields: ["name"] }]);
  assert.deepEqual(validateTextField("category", "a".repeat(31)).errors, [
    { code: "CATEGORY_TOO_LONG", fields: ["category"] },
  ]);
});

test("001/RF-3.6 validateTextField counts the length after normalizing", () => {
  const raw = `${"a".repeat(14)}   ${"b".repeat(15)}`; // 32 characters, 30 once normalized
  const result = validateTextField("name", raw);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value, `${"a".repeat(14)} ${"b".repeat(15)}`);
});

test("001/RF-3.6 validateTextField counts an emoji as one character", () => {
  assert.deepEqual(validateTextField("name", "😀".repeat(30)).errors, []);
  assert.deepEqual(validateTextField("name", "😀".repeat(31)).errors, [{ code: "NAME_TOO_LONG", fields: ["name"] }]);
});

test("001/RF-3.8 validateTextField rejects every disallowed character and sequence", () => {
  const disallowed = ["<", ">", "{", "}", "$", ";", "'", '"', "`", "--", "/*", "*/"];
  for (const item of disallowed) {
    const result = validateTextField("name", `Estudiar ${item} hoy`);
    assert.deepEqual(result.errors, [{ code: "TEXT_NOT_ALLOWED", fields: ["name"] }], `expected ${item} to be rejected`);
  }
  assert.deepEqual(validateTextField("category", "<script>").errors, [
    { code: "TEXT_NOT_ALLOWED", fields: ["category"] },
  ]);
});

test("001/RF-3.8 validateTextField accepts emojis, accents, ñ, digits and normal punctuation", () => {
  for (const accepted of ["Ejercicio 💪", "Niño canción", "Tarea 2", "Leer: capítulo 3 (parte 1)", "Plan - semana", "¿Qué hacer?"]) {
    assert.deepEqual(validateTextField("name", accepted).errors, [], `expected ${accepted} to be accepted`);
  }
});

test("001/RF-3.1 validateTextField returns the normalized value", () => {
  assert.equal(validateTextField("name", "  Estudiar   inglés ").value, "Estudiar inglés");
});

// ---- Day and times (T-07) ----

const codesOf = (result) => result.errors.map((error) => error.code);

test("001/RF-3.3 validateSchedule reports DAY_REQUIRED, START_REQUIRED and END_REQUIRED when missing", () => {
  assert.deepEqual(validateSchedule({}).errors, [
    { code: "DAY_REQUIRED", fields: ["day"] },
    { code: "START_REQUIRED", fields: ["start"] },
    { code: "END_REQUIRED", fields: ["end"] },
  ]);
  assert.deepEqual(codesOf(validateSchedule({ day: "", start: "  ", end: null })), [
    "DAY_REQUIRED",
    "START_REQUIRED",
    "END_REQUIRED",
  ]);
  assert.deepEqual(codesOf(validateSchedule(undefined)), ["DAY_REQUIRED", "START_REQUIRED", "END_REQUIRED"]);
});

test("001/RF-3.9 validateSchedule reports DAY_INVALID for a day outside the 7 keys", () => {
  for (const day of ["Monday", "lunes", "funday", 3]) {
    assert.deepEqual(
      validateSchedule({ day, start: "10:00", end: "11:00" }).errors,
      [{ code: "DAY_INVALID", fields: ["day"] }],
      `expected ${String(day)} to be invalid`,
    );
  }
});

test("001/RF-3.7 validateSchedule reports TIME_INVALID for a malformed time", () => {
  assert.deepEqual(validateSchedule({ day: "monday", start: "25:99", end: "11:00" }).errors, [
    { code: "TIME_INVALID", fields: ["start"] },
  ]);
  assert.deepEqual(validateSchedule({ day: "monday", start: "10:00", end: "abc" }).errors, [
    { code: "TIME_INVALID", fields: ["end"] },
  ]);
});

test("001/RF-3.5 validateSchedule rejects an end equal to or before the start", () => {
  const expected = [{ code: "END_NOT_AFTER_START", fields: ["end"] }];
  assert.deepEqual(validateSchedule({ day: "monday", start: "10:00", end: "10:00" }).errors, expected);
  assert.deepEqual(validateSchedule({ day: "monday", start: "10:00", end: "09:00" }).errors, expected);
});

test("001/RF-3.5 validateSchedule rejects an activity that crosses midnight", () => {
  assert.deepEqual(validateSchedule({ day: "monday", start: "23:00", end: "01:00" }).errors, [
    { code: "END_NOT_AFTER_START", fields: ["end"] },
  ]);
});

test("001/RF-3.4 validateSchedule accepts 23:59-00:00, 00:00-23:59 and a 1 minute activity", () => {
  assert.deepEqual(validateSchedule({ day: "sunday", start: "23:59", end: "00:00" }).value, {
    day: "sunday",
    startMinute: 1439,
    endMinute: 1440,
  });
  assert.deepEqual(validateSchedule({ day: "monday", start: "00:00", end: "23:59" }).value, {
    day: "monday",
    startMinute: 0,
    endMinute: 1439,
  });
  assert.deepEqual(validateSchedule({ day: "friday", start: "10:00", end: "10:01" }).value, {
    day: "friday",
    startMinute: 600,
    endMinute: 601,
  });
});

test("001/RF-3.4 validateSchedule accepts 00:00-00:00 as a full day", () => {
  const result = validateSchedule({ day: "tuesday", start: "00:00", end: "00:00" });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value, { day: "tuesday", startMinute: 0, endMinute: 1440 });
});

test("001/RF-3.10 validateSchedule reports all errors together", () => {
  assert.deepEqual(codesOf(validateSchedule({ day: "x", start: "bad", end: "" })), [
    "DAY_INVALID",
    "TIME_INVALID",
    "END_REQUIRED",
  ]);
});
