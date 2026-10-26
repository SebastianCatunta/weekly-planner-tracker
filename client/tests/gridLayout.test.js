import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule, closeLoader } from "./loadModule.js";
import { GRID_HEIGHT_PX, MIN_BLOCK_PX, gridHeight, layoutDay } from "../src/utils/gridLayout.js";

after(closeLoader);

const act = (id, startMinute, endMinute, day = "monday") => ({
  id, name: `N${id}`, category: `C${id}`, day, start: "00:00", end: "00:00", startMinute, endMinute,
});

test("top is startMinute / 1440 and height is (end - start) / 1440 of the grid", () => {
  const [block] = layoutDay([act("1", 1080, 1200)]);
  assert.equal(block.top, (1080 / 1440) * GRID_HEIGHT_PX);
  assert.equal(block.height, (120 / 1440) * GRID_HEIGHT_PX);
});

test("a 1-minute activity is at least 20 px tall", () => {
  const [block] = layoutDay([act("1", 600, 601)]);
  assert.equal(block.height, MIN_BLOCK_PX);
});

test("an activity from 00:00 to 00:00 fills the whole day", () => {
  const [block] = layoutDay([act("1", 0, 1440)]);
  assert.equal(block.top, 0);
  assert.equal(block.height, GRID_HEIGHT_PX);
});

test("activities that only touch at the edge are not moved", () => {
  const [a, b] = layoutDay([act("1", 600, 660), act("2", 660, 720)]);
  assert.equal(b.top, (660 / 1440) * GRID_HEIGHT_PX);
  assert.ok(Math.abs(a.top + a.height - b.top) < 0.001);
});

test("a minimum-height block that would touch the next one pushes it down so they never overlap", () => {
  const blocks = layoutDay([act("1", 600, 601), act("2", 601, 602), act("3", 602, 700), act("0", 0, 60)]);
  assert.deepEqual(blocks.map((b) => b.activity.id), ["0", "1", "2", "3"]);
  for (let i = 1; i < blocks.length; i++) {
    assert.ok(blocks[i].top >= blocks[i - 1].top + blocks[i - 1].height - 0.001, `block ${i} overlaps`);
  }
  assert.equal(blocks[2].top, blocks[1].top + MIN_BLOCK_PX);
});

test("the grid grows only if shifted blocks end below the last row", () => {
  assert.equal(gridHeight(layoutDay([act("1", 0, 60)])), GRID_HEIGHT_PX);
  const crowded = layoutDay(Array.from({ length: 5 }, (_, i) => act(String(i), 1439, 1440)));
  assert.ok(gridHeight(crowded) > GRID_HEIGHT_PX);
});

const renderGrid = async (activities) => {
  const { default: WeeklyGrid } = await loadModule("/src/components/WeeklyGrid.jsx");
  return renderToStaticMarkup(createElement(WeeklyGrid, { activities }));
};

test("a block appears in the column of its day, with name, category and hours as text", async () => {
  const html = await renderGrid([
    { id: "1", name: "Estudiar", category: "Estudio", day: "tuesday", start: "18:00", end: "20:00", startMinute: 1080, endMinute: 1200 },
  ]);
  const column = html.split('data-day="')[2]; // monday is [1], tuesday is [2]
  assert.match(column, /^tuesday"/);
  const tuesday = column.split('data-day="')[0];
  assert.match(tuesday, /Estudiar/);
  assert.match(tuesday, />Estudio</);
  assert.match(tuesday, /18:00–20:00/);
  assert.match(tuesday, new RegExp(`top:${(1080 / 1440) * GRID_HEIGHT_PX}px;height:${(120 / 1440) * GRID_HEIGHT_PX}px`));
  // Not in any other column.
  assert.equal([...html.matchAll(/activity-block/g)].length, 1);
});

test("the category has no color", async () => {
  const html = await renderGrid([
    { id: "1", name: "A", category: "Estudio", day: "monday", start: "01:00", end: "02:00", startMinute: 60, endMinute: 120 },
  ]);
  assert.doesNotMatch(html, /background|color/);
});
