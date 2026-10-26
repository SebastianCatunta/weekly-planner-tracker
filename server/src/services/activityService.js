import { validateActivity, findConflicts, formatMinutes } from "../core/index.js";
import { createWriteQueue } from "./writeQueue.js";
import { DatabaseUnavailableError, DataCorruptError } from "../db/errors.js";

// 001/RF-1.1, 001/RF-2.3
// The end of the day is shown as "00:00" (formatMinutes), the minutes position it in the grid.
function toActivityDto(activity) {
  return {
    id: activity.id,
    name: activity.name,
    category: activity.category,
    day: activity.day,
    start: formatMinutes(activity.startMinute),
    end: formatMinutes(activity.endMinute),
    startMinute: activity.startMinute,
    endMinute: activity.endMinute,
  };
}

// 001/RF-7.1, 001/RF-7.2, 001/RF-7.4
// Turns repository errors into result codes. The raw error never leaves the service.
function toFailure(error) {
  if (error instanceof DatabaseUnavailableError) return { ok: false, code: "DB_UNAVAILABLE" };
  if (error instanceof DataCorruptError) return { ok: false, code: "DATA_CORRUPT" };
  return { ok: false, code: "INTERNAL" };
}

// 001/RF-4.1
function toConflictDto(activity) {
  return {
    id: activity.id,
    name: activity.name,
    start: formatMinutes(activity.startMinute),
    end: formatMinutes(activity.endMinute),
  };
}

// Builds the service around its dependencies so tests can pass a fake repository.
export function createActivityService({ repository, writeQueue = createWriteQueue(), eventHub = null }) {
  // 001/RF-3.9, 001/RF-4.1, 001/RF-4.4, 001/RF-4.5
  // Fixed order: fields, then conflicts, then saving. Checking and saving run inside the queue,
  // one registration at a time, so the second of two clashing requests sees the first one saved.
  async function createActivity(input) {
    const validation = validateActivity(input);
    if (!validation.ok) {
      return { ok: false, code: "VALIDATION_FAILED", details: validation.errors };
    }
    const candidate = validation.value;

    try {
      return await writeQueue.run(() => checkAndSave(candidate));
    } catch (error) {
      return toFailure(error);
    }
  }

  async function checkAndSave(candidate) {
    const sameDay = await repository.findByDay(candidate.day);
    const { conflicts, isDuplicate } = findConflicts(candidate, sameDay);
    if (conflicts.length > 0) {
      return {
        ok: false,
        code: isDuplicate ? "DUPLICATE_OVERLAP" : "OVERLAP",
        fields: ["day", "start", "end"],
        conflicts: conflicts.map(toConflictDto),
      };
    }

    const saved = await repository.insert({ ...candidate, createdAt: new Date() });
    const activity = toActivityDto(saved);
    // 001/RF-8.1
    // Only after the activity is saved: a rejected registration never emits.
    eventHub?.broadcast("activity-created", activity);
    return { ok: true, activity };
  }

  // 001/RF-1.1, 001/RF-6.1, 001/RF-7.4
  // The repository already returns the list ordered and complete, or throws: a partial list is
  // never returned.
  async function listActivities() {
    try {
      const activities = await repository.findAll();
      return { ok: true, activities: activities.map(toActivityDto) };
    } catch (error) {
      return toFailure(error);
    }
  }

  return { createActivity, listActivities };
}
