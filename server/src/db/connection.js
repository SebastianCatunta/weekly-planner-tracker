import { MongoClient } from "mongodb";
import { DatabaseUnavailableError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 5000;
const DB_NAME = "weekly_planner";

let client = null;

// 001/RF-7.1
// Connects once and reuses the client. Every failure becomes DatabaseUnavailableError, so the
// connection string (which can hold credentials) never reaches a message or a log.
export async function connect({ uri = process.env.MONGODB_URI, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (client) return getDb();
  if (!uri) throw new DatabaseUnavailableError();

  let candidate;
  try {
    candidate = new MongoClient(uri, { serverSelectionTimeoutMS: timeoutMs });
    await candidate.connect();
    await candidate.db(DB_NAME).command({ ping: 1 });
  } catch {
    await candidate?.close().catch(() => {});
    throw new DatabaseUnavailableError();
  }
  client = candidate;
  return getDb();
}

export function getDb() {
  if (!client) throw new DatabaseUnavailableError();
  return client.db(DB_NAME);
}

export async function close() {
  if (!client) return;
  const current = client;
  client = null;
  await current.close();
}

// 001/RF-7.1
// Network and server-selection failures mean "database unavailable"; anything else is unexpected
// and goes up unchanged.
const UNAVAILABLE_ERRORS = new Set([
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoServerSelectionError",
  "MongoNotConnectedError",
  "MongoTopologyClosedError",
  "MongoPoolClearedError",
  "MongoPoolClosedError",
]);

export function toDatabaseError(error) {
  if (error instanceof DatabaseUnavailableError) return error;
  if (UNAVAILABLE_ERRORS.has(error?.name)) return new DatabaseUnavailableError();
  return error;
}
