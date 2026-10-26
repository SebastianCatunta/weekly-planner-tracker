// State of the activity form. Pure, so it can be tested without a browser.

export const FIELDS = ["name", "category", "day", "start", "end"];
export const EMPTY_VALUES = { name: "", category: "", day: "", start: "", end: "" };

// 001/RF-2.1
// The five fields start empty.
export const initialFormState = { values: EMPTY_VALUES };

export function formReducer(state, action) {
  switch (action.type) {
    case "change":
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    default:
      return state;
  }
}
