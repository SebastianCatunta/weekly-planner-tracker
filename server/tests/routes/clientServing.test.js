import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Router } from "express";
import { startApp } from "./helpers.js";

// A fake "compiled client" folder, like client/dist.
const clientDir = mkdtempSync(join(tmpdir(), "planner-client-"));
mkdirSync(join(clientDir, "assets"));
writeFileSync(join(clientDir, "index.html"), "<!doctype html><title>Planner</title><div id=\"root\"></div>");
writeFileSync(join(clientDir, "assets", "app.js"), "console.log('client');");

const apiRouter = Router();
apiRouter.get("/ping", (req, res) => res.json({ pong: true }));

let api;
let withoutClient;
before(async () => {
  api = await startApp({ clientDir, routers: [["/api", apiRouter]] });
  withoutClient = await startApp({ routers: [["/api", apiRouter]] });
});
after(async () => {
  await api.close();
  await withoutClient.close();
  rmSync(clientDir, { recursive: true, force: true });
});

test("the page is served from the server's own address", async () => {
  const res = await api.request("/");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.match(await res.text(), /<div id="root">/);
});

test("the compiled assets are served", async () => {
  const res = await api.request("/assets/app.js");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /javascript/);
  assert.match(await res.text(), /console\.log\('client'\)/);
});

test("any other path outside /api gets the page", async () => {
  const res = await api.request("/semana/lunes");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<div id="root">/);
});

test("the API keeps working next to the client", async () => {
  const res = await api.request("/api/ping");
  assert.deepEqual(await res.json(), { pong: true });
});

test("an unknown /api path still answers the JSON 404, not the page", async () => {
  for (const path of ["/api/nope", "/api"]) {
    const res = await api.request(path);
    assert.equal(res.status, 404, path);
    assert.deepEqual(await res.json(), { error: { code: "NOT_FOUND" } }, path);
  }
});

test("without a compiled client, the root answers the JSON 404", async () => {
  const res = await withoutClient.request("/");
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: { code: "NOT_FOUND" } });
});
