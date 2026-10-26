// State of the activity form. Pure, so it can be tested without a browser.

export const FIELDS = ["name", "category", "day", "start", "end"];
export const EMPTY_VALUES = { name: "", category: "", day: "", start: "", end: "" };

// 001/RF-2.1
// The five fields start empty. `status` is idle -> saving -> saved (or back to idle if it fails).
// `timeKeys` change when a time field is emptied from outside, which makes its TimeSelect start
// over (it keeps a half-chosen time to itself).
export const initialFormState = {
  values: EMPTY_VALUES,
  status: "idle",
  timeKeys: { start: 0, end: 0 },
};

export function formReducer(state, action) {
  switch (action.type) {
    case "change":
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case "submit-started":
      return { ...state, status: "saving" };
    // 001/RF-2.4
    // Saved: the five fields are emptied.
    case "saved":
      return {
        ...state,
        status: "saved",
        values: EMPTY_VALUES,
        timeKeys: { start: state.timeKeys.start + 1, end: state.timeKeys.end + 1 },
      };
    case "submit-ended":
      return { ...state, status: "idle" };
    default:
      return state;
  }
}
