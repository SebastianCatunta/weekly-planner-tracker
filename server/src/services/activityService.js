import { validateActivity, findConflicts, formatMinutes } from "../core/index.js";
import { createWriteQueue } from "./writeQueue.js";

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
export function createActivityService({ repository, writeQueue = createWriteQueue() }) {
  // 001/RF-3.9, 001/RF-4.1, 001/RF-4.4, 001/RF-4.5
  // Fixed order: fields, then conflicts, then saving. Checking and saving run inside the queue,
  // one registration at a time, so the second of two clashing requests sees the first one saved.
  async function createActivity(input) {
    const validation = validateActivity(input);
    if (!validation.ok) {
      return { ok: false, code: "VALIDATION_FAILED", details: validation.errors };
    }
    const candidate = validation.value;

    return writeQueue.run(async () => {
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
      return { ok: true, activity: saved };
    });
  }

  return { createActivity };
}
