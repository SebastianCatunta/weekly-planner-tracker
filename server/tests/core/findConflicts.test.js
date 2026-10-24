import { test } from "node:test";
import assert from "node:assert/strict";
import { overlaps, findConflicts } from "../../src/core/findConflicts.js";

const activity = (id, day, startMinute, endMinute, name = "Estudiar", category = "Estudio") => ({
  id,
  name,
  category,
  day,
  startMinute,
  endMinute,
});

const idsOf = (result) => result.conflicts.map((conflict) => conflict.id);

test("001/RF-4.1 overlaps detects a partial overlap", () => {
  assert.equal(overlaps(activity("a", "monday", 600, 720), activity("b", "monday", 660, 780)), true);
  assert.equal(overlaps(activity("a", "monday", 660, 780), activity("b", "monday", 600, 720)), true);
});

test("001/RF-4.1 overlaps detects an activity contained in another and one that contains another", () => {
  assert.equal(overlaps(activity("a", "monday", 600, 720), activity("b", "monday", 630, 660)), true);
  assert.equal(overlaps(activity("a", "monday", 600, 720), activity("b", "monday", 540, 780)), true);
});

test("001/RF-4.2 overlaps does not count touching activities as an overlap", () => {
  assert.equal(overlaps(activity("a", "monday", 600, 720), activity("b", "monday", 720, 780)), false);
  assert.equal(overlaps(activity("a", "monday", 600, 720), activity("b", "monday", 540, 600)), false);
});

test("001/RF-4.1 findConflicts returns a partially overlapping activity", () => {
  const existing = [activity("a", "monday", 600, 720)];
  assert.deepEqual(idsOf(findConflicts(activity("new", "monday", 660, 780), existing)), ["a"]);
});

test("001/RF-4.1 findConflicts returns a contained activity and one that contains the candidate", () => {
  const existing = [activity("a", "monday", 600, 720)];
  assert.deepEqual(idsOf(findConflicts(activity("new", "monday", 630, 660), existing)), ["a"]);
  assert.deepEqual(idsOf(findConflicts(activity("new", "monday", 540, 780), existing)), ["a"]);
});

test("001/RF-4.2 findConflicts accepts an activity that starts when another ends", () => {
  const existing = [activity("a", "monday", 600, 720), activity("b", "monday", 780, 840)];
  assert.deepEqual(findConflicts(activity("new", "monday", 720, 780), existing).conflicts, []);
});

test("001/RF-4.1 findConflicts returns every activity that overlaps, not only the first", () => {
  const existing = [
    activity("a", "monday", 600, 660),
    activity("b", "monday", 700, 760),
    activity("c", "monday", 900, 960),
  ];
  assert.deepEqual(idsOf(findConflicts(activity("new", "monday", 630, 730), existing)), ["a", "b"]);
});

test("001/RF-4.3 findConflicts never conflicts with an activity of another day", () => {
  const existing = [activity("a", "tuesday", 600, 720)];
  assert.deepEqual(findConflicts(activity("new", "monday", 600, 720), existing).conflicts, []);
});

test("001/RF-4.1 findConflicts returns no conflicts when there are no activities", () => {
  assert.deepEqual(findConflicts(activity("new", "monday", 600, 720), []).conflicts, []);
});
