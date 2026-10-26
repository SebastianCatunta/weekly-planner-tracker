import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule, closeLoader } from "./loadModule.js";

after(closeLoader);

// useEffect does not run when rendering to a string, so App shows its first state: loading.
test("App first shows the loading message and no grid", async () => {
  const { default: App } = await loadModule("/src/App.jsx");
  const html = renderToStaticMarkup(createElement(App));
  assert.match(html, /Cargando tus actividades/);
  assert.doesNotMatch(html, /weekly-grid/);
});
