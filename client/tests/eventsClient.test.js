import { test } from "node:test";
import assert from "node:assert/strict";
import { subscribeToActivityEvents } from "../src/api/eventsClient.js";

// Minimal stand-in for EventSource that lets the test fire events.
function fakeSource() {
  const listeners = {};
  return {
    url: null,
    closed: false,
    readyState: 1,
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    close() { this.closed = true; },
    fire(type, event = {}) { (listeners[type] ?? []).forEach((fn) => fn(event)); },
  };
}

function subscribe() {
  const sources = [];
  const calls = { created: [], reconnects: 0 };
  const unsubscribe = subscribeToActivityEvents({
    onCreated: (activity) => calls.created.push(activity),
    onReconnect: () => { calls.reconnects += 1; },
    createSource: (url) => {
      const created = fakeSource();
      created.url = url;
      sources.push(created);
      return created;
    },
    retryMs: 20,
  });
  return { get source() { return sources.at(-1); }, sources, calls, unsubscribe };
}

test("subscribes to /api/events", () => {
  assert.equal(subscribe().source.url, "/api/events");
});

test("an activity-created event gives the activity to onCreated", () => {
  const { source, calls } = subscribe();
  const activity = { id: "1", name: "Estudiar" };
  source.fire("activity-created", { data: JSON.stringify(activity) });
  assert.deepEqual(calls.created, [activity]);
});

test("a message that is not valid JSON is ignored", () => {
  const { source, calls } = subscribe();
  source.fire("activity-created", { data: "{broken" });
  assert.deepEqual(calls.created, []);
});

test("the first connection does not ask for a reload", () => {
  const { source, calls } = subscribe();
  source.fire("open");
  assert.equal(calls.reconnects, 0);
});

test("when the connection is lost and comes back, it asks for a reload once", () => {
  const { source, calls } = subscribe();
  source.fire("open");
  source.fire("error");
  source.fire("error"); // the browser can report several errors while it retries
  source.fire("open");
  assert.equal(calls.reconnects, 1);
  source.fire("open");
  assert.equal(calls.reconnects, 1);
});

test("unsubscribe closes the connection", () => {
  const { source, unsubscribe } = subscribe();
  unsubscribe();
  assert.equal(source.closed, true);
});

test("if the browser gives up (CLOSED), a new connection is opened after a pause and a reload is asked", async () => {
  const { source, sources, calls } = subscribe();
  source.fire("open");
  source.readyState = 2;
  source.fire("error");
  assert.equal(sources.length, 1);

  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(sources.length, 2, "a second connection was opened");

  sources[1].fire("open");
  assert.equal(calls.reconnects, 1);
});

test("while the browser is still retrying by itself, no second connection is opened", async () => {
  const { source, sources } = subscribe();
  source.readyState = 0; // CONNECTING
  source.fire("error");
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(sources.length, 1);
});

test("after unsubscribe no new connection is opened", async () => {
  const { source, sources, unsubscribe } = subscribe();
  source.readyState = 2;
  source.fire("error");
  unsubscribe();
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(sources.length, 1);
});
