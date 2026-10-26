import { useCallback, useEffect, useReducer } from "react";
import { getActivities } from "../api/activitiesApi.js";
import { activitiesReducer, initialState } from "./activitiesState.js";

// 001/RF-1.1, 001/RF-7.4
// status: "loading" -> "ready" or "failed". The list is only meaningful when status is "ready".
export function useActivities() {
  const [state, dispatch] = useReducer(activitiesReducer, initialState);

  const load = useCallback(async () => {
    const result = await getActivities();
    dispatch(result.ok ? { type: "loaded", activities: result.data } : { type: "load-failed" });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addActivity = useCallback((activity) => dispatch({ type: "added", activity }), []);

  return { status: state.status, activities: state.activities, reload: load, addActivity };
}
