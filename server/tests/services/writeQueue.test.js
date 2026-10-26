import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { createWriteQueue } from "../../src/services/writeQueue.js";

test("the second task starts only when the first one finishes", async () => {
  const queue = createWriteQueue();
  const log = [];

  const first = queue.run(async () => {
    log.push("first:start");
    await sleep(50);
    log.push("first:end");
    return 1;
  });
  const second = queue.run(async () => {
    log.push("second:start");
    await sleep(5);
    log.push("second:end");
    return 2;
  });

  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  assert.deepEqual(log, ["first:start", "first:end", "second:start", "second:end"]);
});

test("if the first task fails, its caller gets the error and the queue keeps working", async () => {
  const queue = createWriteQueue();
  const failing = queue.run(async () => {
    await sleep(10);
    throw new Error("boom");
  });
  const next = queue.run(async () => "still works");

  await assert.rejects(failing, /boom/);
  assert.equal(await next, "still works");
  assert.equal(await queue.run(async () => "later"), "later");
});

test("a synchronous throw in a task is also contained", async () => {
  const queue = createWriteQueue();
  await assert.rejects(queue.run(() => { throw new Error("sync"); }), /sync/);
  assert.equal(await queue.run(async () => "ok"), "ok");
});
