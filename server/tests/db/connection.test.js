import { test } from "node:test";
import assert from "node:assert/strict";
import { connect, close, getDb, toDatabaseError } from "../../src/db/connection.js";
import { DatabaseUnavailableError } from "../../src/db/errors.js";

// Nothing listens on port 1, so this address simulates MongoDB being off.
const DEAD_URI = "mongodb://user:secret@127.0.0.1:1/?directConnection=true";

test("connect fails with DatabaseUnavailableError when MongoDB is unreachable", async () => {
  await assert.rejects(connect({ uri: DEAD_URI, timeoutMs: 300 }), DatabaseUnavailableError);
});

test("the error message does not include the connection string", async () => {
  try {
    await connect({ uri: DEAD_URI, timeoutMs: 300 });
    assert.fail("should have thrown");
  } catch (error) {
    assert.ok(error instanceof DatabaseUnavailableError);
    assert.doesNotMatch(error.message, /127\.0\.0\.1|secret|mongodb:/);
  }
});

test("connect fails with DatabaseUnavailableError when the address is missing or malformed", async () => {
  await assert.rejects(connect({ uri: "" }), DatabaseUnavailableError);
  await assert.rejects(connect({ uri: "not-a-uri" }), DatabaseUnavailableError);
});

test("getDb before connecting throws DatabaseUnavailableError", () => {
  assert.throws(() => getDb(), DatabaseUnavailableError);
});

test("toDatabaseError translates connection failures and keeps unexpected errors", () => {
  const network = Object.assign(new Error("boom"), { name: "MongoNetworkError" });
  const selection = Object.assign(new Error("boom"), { name: "MongoServerSelectionError" });
  const other = new TypeError("bug");
  assert.ok(toDatabaseError(network) instanceof DatabaseUnavailableError);
  assert.ok(toDatabaseError(selection) instanceof DatabaseUnavailableError);
  assert.equal(toDatabaseError(other), other);
});

// Runs only when MONGODB_URI points to a live MongoDB.
test("connect works with MongoDB on", { skip: !process.env.MONGODB_URI }, async () => {
  const db = await connect();
  assert.equal((await db.command({ ping: 1 })).ok, 1);
  await close();
});
