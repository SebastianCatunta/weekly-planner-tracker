import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule, closeLoader } from "./loadModule.js";
import { EMPTY_VALUES, FIELDS, formReducer, initialFormState } from "../src/hooks/formState.js";

after(closeLoader);

const render = async () => {
  const { default: ActivityForm } = await loadModule("/src/components/ActivityForm.jsx");
  return renderToStaticMarkup(createElement(ActivityForm, { onSubmit: async () => ({ ok: true }) }));
};

test("the five fields start empty", () => {
  assert.deepEqual(FIELDS, ["name", "category", "day", "start", "end"]);
  assert.deepEqual(initialFormState.values, EMPTY_VALUES);
  assert.ok(Object.values(initialFormState.values).every((v) => v === ""));
});

test("change updates only the given field", () => {
  const state = formReducer(initialFormState, { type: "change", field: "name", value: "Estudiar" });
  assert.deepEqual(state.values, { ...EMPTY_VALUES, name: "Estudiar" });
});

test("shows name, category, one day selector, start, end and a save button, all empty", async () => {
  const html = await render();
  assert.match(html, /Nombre/);
  assert.match(html, /Categoría/);
  assert.match(html, /Día de la semana/);
  assert.match(html, /Hora de inicio/);
  assert.match(html, /Hora de fin/);
  assert.match(html, /<button type="submit">Guardar actividad<\/button>/);
  assert.match(html, /<input type="text" name="name" value=""/);
  assert.match(html, /<input type="text" name="category" value=""/);
});

test("the day selector offers the 7 days and allows only one choice", async () => {
  const html = await render();
  const select = html.match(/<select name="day"[^>]*>(.*?)<\/select>/)[1];
  const days = [...select.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(days, ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
  assert.doesNotMatch(html, /<select name="day"[^>]*multiple/);
  assert.doesNotMatch(html, /type="checkbox"/);
});

test("two time selectors, start and end", async () => {
  const html = await render();
  assert.equal([...html.matchAll(/class="time-select"/g)].length, 2);
});

const filled = { name: "Estudiar", category: "Estudio", day: "monday", start: "18:00", end: "20:00" };

test("submitting moves to saving and does not empty anything yet", () => {
  let state = { ...initialFormState, values: filled };
  state = formReducer(state, { type: "submit-started" });
  assert.equal(state.status, "saving");
  assert.deepEqual(state.values, filled);
});

test("saved empties the five fields and restarts the time lists", () => {
  let state = { ...initialFormState, values: filled };
  state = formReducer(state, { type: "submit-started" });
  state = formReducer(state, { type: "saved" });
  assert.equal(state.status, "saved");
  assert.deepEqual(state.values, EMPTY_VALUES);
  assert.deepEqual(state.timeKeys, { start: 1, end: 1 });
});
