import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import { createEventHub } from "../../src/events/eventHub.js";
import { createEventsRouter } from "../../src/routes/eventsRoutes.js";
import { startApp } from "./helpers.js";

const hub = createEventHub();
let api;
before(async () => {
  api = await startApp({ routers: [["/api", createEventsRouter(hub, { heartbeatMs: 40 })]] });
});
after(() => api.close());

// Opens /api/events and collects what the server sends, until the test destroys the request.
function openStream() {
  return new Promise((resolve, reject) => {
    const received = [];
    const req = http.get(`${api.baseUrl}/api/events`, (res) => {
      res.setEncoding("utf8");
      res.on("data", (chunk) => received.push(chunk));
      resolve({ res, received, req });
    });
    req.on("error", reject);
  });
}

async function waitFor(condition, ms = 1000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (condition()) return true;
    await sleep(10);
  }
  return condition();
}

test("the connection stays open as an event stream and receives keep-alive comments", async () => {
  const { res, received, req } = await openStream();
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /text\/event-stream/);

  assert.ok(await waitFor(() => received.join("").split(": keep-alive").length > 2), "periodic comments");
  assert.equal(res.complete, false, "still open");
  assert.equal(hub.size, 1);
  req.destroy();
  assert.ok(await waitFor(() => hub.size === 0));
});

test("closing the connection removes the client and emitting afterwards does not fail", async () => {
  const first = await openStream();
  const second = await openStream();
  assert.ok(await waitFor(() => hub.size === 2));

  first.req.destroy();
  assert.ok(await waitFor(() => hub.size === 1));

  assert.doesNotThrow(() => hub.broadcast("activity-created", { id: "1" }));
  assert.ok(await waitFor(() => second.received.join("").includes("event: activity-created")));
  second.req.destroy();
  assert.ok(await waitFor(() => hub.size === 0));
});
