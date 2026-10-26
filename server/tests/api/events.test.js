import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import { createActivityService } from "../../src/services/activityService.js";
import { createActivitiesRouter } from "../../src/routes/activitiesRoutes.js";
import { createEventsRouter } from "../../src/routes/eventsRoutes.js";
import { createEventHub } from "../../src/events/eventHub.js";
import { createFakeRepository } from "../services/fakeRepository.js";
import { startApp } from "../routes/helpers.js";
import { body, postJson } from "./helpers.js";

// Real routes, service and event hub; only the repository is fake, so no database is needed.
let api;
before(async () => {
  const eventHub = createEventHub();
  const service = createActivityService({ repository: createFakeRepository(), eventHub });
  api = await startApp({
    routers: [
      ["/api", createActivitiesRouter(service)],
      ["/api", createEventsRouter(eventHub, { heartbeatMs: 1000 })],
    ],
  });
});
after(() => api.close());

function openStream() {
  return new Promise((resolve, reject) => {
    const received = [];
    const req = http.get(`${api.baseUrl}/api/events`, (res) => {
      res.setEncoding("utf8");
      res.on("data", (chunk) => received.push(chunk));
      resolve({ received, req, text: () => received.join("") });
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

test("a valid POST reaches two open connections as activity-created with the ActivityDto", async () => {
  const one = await openStream();
  const two = await openStream();
  await waitFor(() => one.text().includes(": connected") && two.text().includes(": connected"));

  const res = await postJson(api, body());
  const { activity } = await res.json();
  assert.equal(res.status, 201);

  for (const stream of [one, two]) {
    assert.ok(await waitFor(() => stream.text().includes("event: activity-created")));
    const data = stream.text().split("event: activity-created\ndata: ")[1].split("\n\n")[0];
    assert.deepEqual(JSON.parse(data), activity);
  }
  one.req.destroy();
  two.req.destroy();
});

test("a rejected POST emits no event", async () => {
  const stream = await openStream();
  await waitFor(() => stream.text().includes(": connected"));

  assert.equal((await postJson(api, body({ name: "" }))).status, 422); // invalid
  assert.equal((await postJson(api, body())).status, 409); // duplicate of the previous test
  assert.equal((await postJson(api, "{bad")).status, 400); // unreadable

  await sleep(150);
  assert.doesNotMatch(stream.text(), /activity-created/);
  stream.req.destroy();
});
