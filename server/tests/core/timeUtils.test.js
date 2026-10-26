import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMinutes, endToMinutes, formatMinutes } from "../../src/core/timeUtils.js";

test("001/RF-3.4 parseMinutes converts HH:MM to minutes since midnight", () => {
  assert.equal(parseMinutes("18:00"), 1080);
  assert.equal(parseMinutes("23:59"), 1439);
  assert.equal(parseMinutes("00:00"), 0);
});

test("001/RF-3.7 parseMinutes rejects malformed or out-of-range times", () => {
  for (const invalid of ["25:00", "12:60", "24:00", "", "abc", "1:00", "12:5", null, undefined, 1200]) {
    assert.equal(parseMinutes(invalid), null, `expected ${String(invalid)} to be invalid`);
  }
});

test("001/RF-3.4 endToMinutes reads 00:00 as the end of the day", () => {
  assert.equal(endToMinutes("00:00"), 1440);
  assert.equal(endToMinutes("23:59"), 1439);
  assert.equal(endToMinutes("18:00"), 1080);
});

test("001/RF-3.7 endToMinutes rejects invalid times", () => {
  assert.equal(endToMinutes("25:00"), null);
  assert.equal(endToMinutes(""), null);
  assert.equal(endToMinutes(undefined), null);
});

test("001/RF-3.4 formatMinutes shows 1440 as 00:00", () => {
  assert.equal(formatMinutes(1440), "00:00");
  assert.equal(formatMinutes(0), "00:00");
  assert.equal(formatMinutes(1080), "18:00");
  assert.equal(formatMinutes(1439), "23:59");
});
