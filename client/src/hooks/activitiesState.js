import { DAYS } from "../utils/days.js";

export const initialState = { status: "loading", activities: [] };

// Order shown in the grid: day of the week, then start.
function sorted(activities) {
  return [...activities].sort(
    (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startMinute - b.startMinute,
  );
}

// Keeps one entry per id, so an activity that arrives twice (the answer to the request and the
// server event) is shown once.
function merge(current, incoming) {
  const byId = new Map(current.map((activity) => [activity.id, activity]));
  for (const activity of incoming) byId.set(activity.id, activity);
  return sorted([...byId.values()]);
}

// 001/RF-7.4
// `failed` never carries a list: an empty or partial schedule must not look like the real one.
export function activitiesReducer(state, action) {
  switch (action.type) {
    case "loaded":
      return { status: "ready", activities: merge(state.activities, action.activities) };
    case "load-failed":
      return { status: "failed", activities: [] };
    case "added":
      return { ...state, activities: merge(state.activities, [action.activity]) };
    default:
      return state;
  }
}
