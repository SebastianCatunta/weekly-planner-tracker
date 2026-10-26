import { ObjectId } from "mongodb";
import { connect, toDatabaseError } from "../db/connection.js";
import { DataCorruptError } from "../db/errors.js";
import { DAYS, validateActivity, formatMinutes } from "../core/index.js";

const COLLECTION = "activities";

// Connects on first use and reconnects after a failure, so the server can start with MongoDB off
// and recover when it comes back. Throws DatabaseUnavailableError if it cannot connect.
async function activities() {
  return (await connect()).collection(COLLECTION);
}

// Maps a stored document to a plain record; the Mongo _id never leaves this module.
function toRecord(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    day: doc.day,
    startMinute: doc.startMinute,
    endMinute: doc.endMinute,
    createdAt: doc.createdAt,
  };
}

// 001/RF-4.1, 001/RF-5.2
export async function ensureIndexes() {
  try {
    await (await activities()).createIndex({ day: 1, startMinute: 1 });
  } catch (error) {
    throw toDatabaseError(error);
  }
}

// 001/RF-2.2, 001/RF-2.3, 001/RF-6.2, 001/RF-6.3
// Stores only the plan's fields: no user and no week (one recurring schedule for everyone).
export async function insert(activity) {
  const doc = {
    _id: new ObjectId(),
    name: activity.name,
    category: activity.category,
    day: activity.day,
    startMinute: activity.startMinute,
    endMinute: activity.endMinute,
    createdAt: activity.createdAt ?? new Date(),
  };
  try {
    await (await activities()).insertOne(doc);
  } catch (error) {
    throw toDatabaseError(error);
  }
  return toRecord(doc);
}

// 001/RF-4.1, 001/RF-5.2
// The filter is built from a plain string with an explicit $eq (RNF-9): a value such as "$ne" or
// { "$ne": "monday" } can never act as an operator, it is only compared as text.
export async function findByDay(day) {
  try {
    const collection = await activities();
    const docs = await collection
      .find({ day: { $eq: String(day) } })
      .sort({ startMinute: 1 })
      .toArray();
    return docs.map(toRecord);
  } catch (error) {
    throw toDatabaseError(error);
  }
}

// 001/RF-7.4
// Strict reading: the stored record must pass the same rules core applies on registration.
// The checks before validateActivity keep wrong types from being turned into valid-looking times.
function isValidRecord(record) {
  const { name, category, day, startMinute, endMinute } = record;
  if (typeof name !== "string" || typeof category !== "string" || typeof day !== "string") return false;
  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 1439) return false;
  if (!Number.isInteger(endMinute) || endMinute < 1 || endMinute > 1440) return false;
  return validateActivity({
    name,
    category,
    day,
    start: formatMinutes(startMinute),
    end: formatMinutes(endMinute),
  }).ok;
}

// 001/RF-6.1, 001/RF-7.4
// Orders by day of the week, then start; throws DataCorruptError instead of returning a partial list.
export function parseStoredActivities(docs) {
  const records = docs.map(toRecord);
  if (!records.every(isValidRecord)) throw new DataCorruptError();
  return records.sort(
    (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startMinute - b.startMinute,
  );
}

// 001/RF-1.1, 001/RF-6.1, 001/RF-7.4
export async function findAll() {
  let docs;
  try {
    docs = await (await activities()).find({}).toArray();
  } catch (error) {
    throw toDatabaseError(error);
  }
  return parseStoredActivities(docs);
}
