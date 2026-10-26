import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule, closeLoader } from "./loadModule.js";
import { EMPTY_VALUES, formReducer, initialFormState } from "../src/hooks/formState.js";

after(closeLoader);

const render = async (path, props) => {
  const { default: Component } = await loadModule(path);
  return renderToStaticMarkup(createElement(Component, props));
};

test("SaveStatus shows the saving icon while saving", async () => {
  const html = await render("/src/components/SaveStatus.jsx", { status: "saving" });
  assert.match(html, /save-status-saving/);
  assert.match(html, /aria-label="Guardando"/);
});

test("SaveStatus shows a different icon when saved", async () => {
  const saving = await render("/src/components/SaveStatus.jsx", { status: "saving" });
  const saved = await render("/src/components/SaveStatus.jsx", { status: "saved" });
  assert.match(saved, /save-status-saved/);
  assert.match(saved, /aria-label="Guardado"/);
  assert.notEqual(saving, saved);
});

test("SaveStatus shows nothing when idle", async () => {
  assert.equal(await render("/src/components/SaveStatus.jsx", { status: "idle" }), "");
});

test("Toast shows the message", async () => {
  const html = await render("/src/components/Toast.jsx", { message: "Listo", onClose() {} });
  assert.match(html, /<p class="toast" role="status">Listo<\/p>/);
});

test("Toast closes after 5 seconds", async () => {
  const { TOAST_DURATION_MS } = await loadModule("/src/components/Toast.jsx");
  assert.equal(TOAST_DURATION_MS, 5000);
});

test("saving then saved: the confirmation shows, then goes away, and the saved icon stays", () => {
  let state = formReducer({ ...initialFormState, values: { ...EMPTY_VALUES, name: "x" } }, { type: "submit-started" });
  assert.equal(state.toastVisible, false);
  state = formReducer(state, { type: "saved" });
  assert.equal(state.toastVisible, true);
  state = formReducer(state, { type: "toast-closed" });
  assert.equal(state.toastVisible, false);
  assert.equal(state.status, "saved");
  state = formReducer(state, { type: "submit-started" });
  assert.equal(state.status, "saving");
});
