import { test } from "node:test";
import assert from "node:assert/strict";
import { createEventHub } from "../../src/events/eventHub.js";

const fakeClient = () => {
  const written = [];
  return { written, write: (chunk) => written.push(chunk) };
};

test("broadcast sends the event in SSE format to every client", () => {
  const hub = createEventHub();
  const a = fakeClient();
  const b = fakeClient();
  hub.add(a);
  hub.add(b);

  hub.broadcast("activity-created", { id: "1", name: "x" });

  const expected = 'event: activity-created\ndata: {"id":"1","name":"x"}\n\n';
  assert.deepEqual(a.written, [expected]);
  assert.deepEqual(b.written, [expected]);
});

test("a removed client no longer receives events", () => {
  const hub = createEventHub();
  const a = fakeClient();
  const remove = hub.add(a);
  assert.equal(hub.size, 1);

  remove();
  hub.broadcast("activity-created", {});

  assert.equal(hub.size, 0);
  assert.deepEqual(a.written, []);
});

test("broadcasting with no clients does nothing", () => {
  assert.doesNotThrow(() => createEventHub().broadcast("activity-created", {}));
});

test("a client that fails on write is dropped and the others still get the event", () => {
  const hub = createEventHub();
  const broken = { write: () => { throw new Error("socket closed"); } };
  const healthy = fakeClient();
  hub.add(broken);
  hub.add(healthy);

  assert.doesNotThrow(() => hub.broadcast("activity-created", { id: "1" }));

  assert.equal(healthy.written.length, 1);
  assert.equal(hub.size, 1);
});
