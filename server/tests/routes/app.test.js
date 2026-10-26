import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Router } from "express";
import { startApp } from "./helpers.js";

const testRouter = Router();
testRouter.post("/echo", (req, res) => res.json({ received: req.body }));
testRouter.get("/boom", () => {
  throw new Error("secret internal detail at C:\app\db.js");
});
testRouter.get("/boom-async", async () => {
  throw new TypeError("secret async detail");
});

let api;
before(async () => {
  api = await startApp({ routers: [["/test", testRouter]] });
});
after(() => api.close());

const post = (path, body) =>
  api.request(path, { method: "POST", headers: { "content-type": "application/json" }, body });

test("the app reads JSON bodies", async () => {
  const res = await post("/test/echo", JSON.stringify({ a: 1 }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { received: { a: 1 } });
});

test("a malformed JSON body on any route answers 400 INVALID_BODY", async () => {
  for (const path of ["/test/echo", "/test/other", "/api/anything"]) {
    const res = await post(path, '{"name": "x",');
    assert.equal(res.status, 400, path);
    assert.deepEqual(await res.json(), { error: { code: "INVALID_BODY" } }, path);
  }
});

test("the 400 answer shows no internal details", async () => {
  const res = await post("/test/echo", "{ not json");
  assert.doesNotMatch(JSON.stringify(await res.json()), /SyntaxError|Unexpected|stack|body-parser|node_modules/i);
});

test("an unhandled failure answers 500 INTERNAL without details, and is logged", async () => {
  for (const path of ["/test/boom", "/test/boom-async"]) {
    const res = await api.request(path);
    assert.equal(res.status, 500, path);
    const text = await res.text();
    assert.deepEqual(JSON.parse(text), { error: { code: "INTERNAL" } }, path);
    assert.doesNotMatch(text, /secret|db\.js|stack/i);
  }
  assert.equal(api.logged.length, 2);
});

test("an unknown route answers 404 with the same error shape", async () => {
  const res = await api.request("/nope");
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: { code: "NOT_FOUND" } });
});
