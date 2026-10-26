// State of the activity form. Pure, so it can be tested without a browser.

export const FIELDS = ["name", "category", "day", "start", "end"];
export const EMPTY_VALUES = { name: "", category: "", day: "", start: "", end: "" };

// 001/RF-2.1
// The five fields start empty. `status` is idle -> saving -> saved or rejected.
// `timeKeys` change when a time field is emptied from outside, which makes its TimeSelect start
// over (it keeps a half-chosen time to itself).
export const initialFormState = {
  values: EMPTY_VALUES,
  status: "idle",
  timeKeys: { start: 0, end: 0 },
  toastVisible: false,
  // Messages of the last rejection, and the fields that were emptied and must be filled again.
  errors: [],
  refill: [],
};

export function formReducer(state, action) {
  switch (action.type) {
    case "change":
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case "submit-started":
      return { ...state, status: "saving", toastVisible: false, errors: [], refill: [] };
    // 001/RF-2.4
    // Saved: the five fields are emptied.
    case "saved":
      return {
        ...state,
        status: "saved",
        toastVisible: true,
        values: EMPTY_VALUES,
        timeKeys: { start: state.timeKeys.start + 1, end: state.timeKeys.end + 1 },
      };
    // 001/RF-2.4
    // The confirmation message goes away after 5 seconds; the "saved" icon stays until the next submit.
    case "toast-closed":
      return { ...state, toastVisible: false };
    // 001/RF-3.10, 001/RF-3.11
    // Rejected: show every message, empty ONLY the listed fields and keep the rest.
    case "rejected": {
      const values = { ...state.values };
      for (const field of action.fields) values[field] = "";
      const bump = (field) => (action.fields.includes(field) ? 1 : 0);
      return {
        ...state,
        status: "rejected",
        values,
        errors: action.messages,
        refill: action.fields,
        timeKeys: { start: state.timeKeys.start + bump("start"), end: state.timeKeys.end + bump("end") },
      };
    }
    // 001/RF-7.1, 001/RF-7.3
    // No connection: show the connection message and keep EVERY field so the user can retry.
    case "connection-error":
      return { ...state, status: "connectionError", errors: [], refill: [] };
    default:
      return state;
  }
}
