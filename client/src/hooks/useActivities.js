import { useCallback, useEffect, useReducer } from "react";
import { getActivities } from "../api/activitiesApi.js";
import { subscribeToActivityEvents } from "../api/eventsClient.js";
import { activitiesReducer, initialState } from "./activitiesState.js";

// 001/RF-1.1, 001/RF-7.4
// status: "loading" -> "ready" or "failed". The list is only meaningful when status is "ready".
export function useActivities() {
  const [state, dispatch] = useReducer(activitiesReducer, initialState);

  // `silent` is for reloads after a lost connection: if one fails, the list on screen stays as
  // it was, because the next reconnection tries again.
  const load = useCallback(async ({ silent = false } = {}) => {
    const result = await getActivities();
    if (result.ok) dispatch({ type: "loaded", activities: result.data });
    else if (!silent) dispatch({ type: "load-failed" });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 001/RF-8.1
  // Activities registered in other tabs arrive as events. The reducer merges by id, so the tab that
  // registered one (which also gets the server answer) does not show it twice.
  useEffect(
    () =>
      subscribeToActivityEvents({
        onCreated: (activity) => dispatch({ type: "added", activity }),
        onReconnect: () => load({ silent: true }),
      }),
    [load],
  );

  const addActivity = useCallback((activity) => dispatch({ type: "added", activity }), []);

  return { status: state.status, activities: state.activities, reload: load, addActivity };
}
