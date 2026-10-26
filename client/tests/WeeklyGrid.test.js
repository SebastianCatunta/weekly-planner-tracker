import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule, closeLoader } from "./loadModule.js";
import { GRID_HEIGHT_PX, ROW_HEIGHT_PX, hourLabel } from "../src/utils/gridLayout.js";

after(closeLoader);

const render = async (props) => {
  const { default: WeeklyGrid } = await loadModule("/src/components/WeeklyGrid.jsx");
  return renderToStaticMarkup(createElement(WeeklyGrid, props));
};

test("the geometry is 24 rows of at least 48 px, 1152 px in total", () => {
  assert.ok(ROW_HEIGHT_PX >= 48);
  assert.equal(GRID_HEIGHT_PX, 1152);
  assert.equal(hourLabel(0), "00:00");
  assert.equal(hourLabel(24), "24:00");
});

test("shows 7 columns from Monday to Sunday with their names and no dates", async () => {
  const html = await render();
  const names = [...html.matchAll(/class="day-name">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(names, ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]);
  assert.equal([...html.matchAll(/class="day-column"/g)].length, 7);
  assert.doesNotMatch(html, /\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/);
});

test("shows 24 hour rows from 00:00 to 24:00 of 48 px, 1152 px in total", async () => {
  const html = await render();
  const labels = [...html.matchAll(/class="hour-label[^"]*"[^>]*>(\d\d:\d\d)</g)].map((m) => m[1]);
  assert.equal(labels.length, 25);
  assert.equal(labels[0], "00:00");
  assert.equal(labels[23], "23:00");
  assert.equal(labels[24], "24:00");
  assert.equal([...html.matchAll(/style="height:48px"/g)].length, 24);
  assert.match(html, /class="grid-body" style="height:1152px"/);
});

test("the grid sits in a scrollable container", async () => {
  assert.match(await render(), /class="grid-scroll"/);
  const css = (await import("node:fs")).readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.grid-scroll\s*\{[^}]*overflow:\s*auto/);
});

test("empty, it shows only the grid: no help text", async () => {
  const html = await render({ activities: [] });
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const allowed = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo|\d\d:\d\d)$/;
  const words = text.split(" ").filter(Boolean);
  assert.ok(words.every((w) => allowed.test(w)), text);
});
