import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startRealApp, body, postJson } from "./helpers.js";

// Own file, own process: MongoDB is unreachable (nothing listens on port 1).
process.env.MONGODB_URI = "mongodb://user:secret@127.0.0.1:1/?directConnection=true&serverSelectionTimeoutMS=300";

let api;
before(async () => {
  api = await startRealApp();
});
after(() => api.close());

test("POST with MongoDB off answers 503 DB_UNAVAILABLE", async () => {
  const res = await postJson(api, body());
  assert.equal(res.status, 503);
  const text = await res.text();
  assert.deepEqual(JSON.parse(text), { error: { code: "DB_UNAVAILABLE" } });
  assert.doesNotMatch(text, /127\.0\.0\.1|secret|mongodb/i);
});

test("GET with MongoDB off answers 503 DB_UNAVAILABLE", async () => {
  const res = await api.request("/api/activities");
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: { code: "DB_UNAVAILABLE" } });
});
