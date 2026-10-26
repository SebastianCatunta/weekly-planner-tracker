import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { activitiesReducer, initialState } from "../src/hooks/activitiesState.js";
import { loadModule, closeLoader } from "./loadModule.js";

after(closeLoader);

const act = (id, day, startMinute) => ({ id, name: `A${id}`, day, startMinute, endMinute: startMinute + 60 });

test("starts in loading with an empty list", () => {
  assert.deepEqual(initialState, { status: "loading", activities: [] });
});

test("loading ends in ready with the list ordered by day and start", () => {
  const state = activitiesReducer(initialState, {
    type: "loaded",
    activities: [act("3", "sunday", 0), act("2", "monday", 600), act("1", "monday", 60)],
  });
  assert.equal(state.status, "ready");
  assert.deepEqual(state.activities.map((a) => a.id), ["1", "2", "3"]);
});

test("a failed load goes to failed and the list is not presented as valid", () => {
  const ready = activitiesReducer(initialState, { type: "loaded", activities: [act("1", "monday", 0)] });
  const state = activitiesReducer(ready, { type: "load-failed" });
  assert.deepEqual(state, { status: "failed", activities: [] });
});

test("an activity added twice (own answer and server event) is kept once", () => {
  let state = activitiesReducer(initialState, { type: "loaded", activities: [] });
  state = activitiesReducer(state, { type: "added", activity: act("1", "monday", 0) });
  state = activitiesReducer(state, { type: "added", activity: act("1", "monday", 0) });
  assert.equal(state.activities.length, 1);
});

test("an activity that arrived while loading is not lost when the list loads", () => {
  let state = activitiesReducer(initialState, { type: "added", activity: act("2", "monday", 600) });
  state = activitiesReducer(state, { type: "loaded", activities: [act("1", "monday", 60)] });
  assert.deepEqual(state.activities.map((a) => a.id), ["1", "2"]);
});

test("LoadNotice shows the loading text while loading", async () => {
  const { default: LoadNotice } = await loadModule("/src/components/LoadNotice.jsx");
  const html = renderToStaticMarkup(createElement(LoadNotice, { status: "loading" }));
  assert.match(html, /Cargando tus actividades/);
});

test("LoadNotice shows the failure text when failed, and nothing when ready", async () => {
  const { default: LoadNotice } = await loadModule("/src/components/LoadNotice.jsx");
  assert.match(
    renderToStaticMarkup(createElement(LoadNotice, { status: "failed" })),
    /Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto\./,
  );
  assert.equal(renderToStaticMarkup(createElement(LoadNotice, { status: "ready" })), "");
});
