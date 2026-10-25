import { ObjectId } from "mongodb";
import { getDb, toDatabaseError } from "../db/connection.js";

const COLLECTION = "activities";

function activities() {
  return getDb().collection(COLLECTION);
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
    await activities().createIndex({ day: 1, startMinute: 1 });
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
    await activities().insertOne(doc);
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
    const docs = await activities()
      .find({ day: { $eq: String(day) } })
      .sort({ startMinute: 1 })
      .toArray();
    return docs.map(toRecord);
  } catch (error) {
    throw toDatabaseError(error);
  }
}
