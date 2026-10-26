import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule, closeLoader } from "./loadModule.js";
import { HOUR_OPTIONS, MINUTE_OPTIONS, joinTime, splitTime } from "../src/utils/timeOptions.js";

after(closeLoader);

test("offers hours 00 to 23 and minutes 00 to 59, nothing else", () => {
  assert.equal(HOUR_OPTIONS.length, 24);
  assert.equal(HOUR_OPTIONS[0], "00");
  assert.equal(HOUR_OPTIONS[23], "23");
  assert.equal(MINUTE_OPTIONS.length, 60);
  assert.equal(MINUTE_OPTIONS[59], "59");
  assert.ok(!HOUR_OPTIONS.includes("24") && !HOUR_OPTIONS.includes("25"));
  assert.ok(!MINUTE_OPTIONS.includes("60") && !MINUTE_OPTIONS.includes("70"));
});

test("joinTime gives HH:MM, or empty if either part is missing", () => {
  assert.equal(joinTime("18", "05"), "18:05");
  assert.equal(joinTime("00", "00"), "00:00");
  assert.equal(joinTime("18", ""), "");
  assert.equal(joinTime("", "30"), "");
  assert.equal(joinTime("", ""), "");
});

test("splitTime reads a valid HH:MM and ignores anything else", () => {
  assert.deepEqual(splitTime("18:05"), { hour: "18", minute: "05" });
  for (const bad of ["", "25:99", "1:5", "abc", undefined, null, 5]) {
    assert.deepEqual(splitTime(bad), { hour: "", minute: "" }, String(bad));
  }
});

const render = async (props) => {
  const { default: TimeSelect } = await loadModule("/src/components/TimeSelect.jsx");
  return renderToStaticMarkup(createElement(TimeSelect, { label: "Hora de inicio", onChange() {}, ...props }));
};

test("renders two lists, hours and minutes, each with an empty first option", async () => {
  const html = await render();
  const selects = html.split("</select>").slice(0, 2);
  assert.equal(selects.length, 2);
  assert.equal([...selects[0].matchAll(/<option/g)].length, 25);
  assert.equal([...selects[1].matchAll(/<option/g)].length, 61);
  assert.match(selects[0], /<option value="" selected="">--<\/option>/);
  assert.doesNotMatch(selects[0], /value="24"/);
  assert.doesNotMatch(selects[1], /value="60"/);
});

test("starts without selection and shows a given value", async () => {
  // Only the empty option of each list is selected.
  assert.deepEqual([...(await render()).matchAll(/<option value="([^"]*)" selected/g)].map((m) => m[1]), ["", ""]);
  const html = await render({ value: "07:30" });
  assert.match(html, /<option value="07" selected="">07<\/option>/);
  assert.match(html, /<option value="30" selected="">30<\/option>/);
});
