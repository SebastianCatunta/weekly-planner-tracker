import { useCallback, useReducer } from "react";
import { messages } from "../messages/es.js";
import { DAYS } from "../utils/days.js";
import { formReducer, initialFormState } from "../hooks/formState.js";
import SaveStatus from "./SaveStatus.jsx";
import TimeSelect from "./TimeSelect.jsx";
import Toast from "./Toast.jsx";

// 001/RF-2.1, 001/RF-2.2, 001/RF-2.3, 001/RF-2.4, 001/RF-7.2
// Five fields that start empty. The day is a single-choice list: one day per registration.
// `onSubmit(values)` must return the API result ({ ok, ... }). Nothing is shown as saved, and
// the fields are not emptied, until the server has answered.
export default function ActivityForm({ onSubmit }) {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const { values, status, timeKeys, toastVisible } = state;
  const closeToast = useCallback(() => dispatch({ type: "toast-closed" }), []);
  const change = (field) => (event) => dispatch({ type: "change", field, value: event.target.value });
  const changeTime = (field) => (value) => dispatch({ type: "change", field, value });

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "saving") return; // a second click while saving is ignored
    dispatch({ type: "submit-started" });
    const result = await onSubmit({ ...values });
    dispatch({ type: result.ok ? "saved" : "submit-ended" });
  }

  return (
    <form className="activity-form" noValidate onSubmit={handleSubmit}>
      <h2>{messages.form.title}</h2>

      <label>
        <span>{messages.form.name}</span>
        <input type="text" name="name" value={values.name} onChange={change("name")} />
      </label>

      <label>
        <span>{messages.form.category}</span>
        <input type="text" name="category" value={values.category} onChange={change("category")} />
      </label>

      <label>
        <span>{messages.form.day}</span>
        <select name="day" value={values.day} onChange={change("day")}>
          <option value="">{messages.form.selectDay}</option>
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {messages.days[day]}
            </option>
          ))}
        </select>
      </label>

      <div className="form-field">
        <span>{messages.form.start}</span>
        <TimeSelect key={timeKeys.start} label={messages.form.start} value={values.start} onChange={changeTime("start")} />
      </div>

      <div className="form-field">
        <span>{messages.form.end}</span>
        <TimeSelect key={timeKeys.end} label={messages.form.end} value={values.end} onChange={changeTime("end")} />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={status === "saving"}>
          {messages.form.save}
        </button>
        <SaveStatus status={status} />
      </div>

      {toastVisible && <Toast message={messages.saved} onClose={closeToast} />}
    </form>
  );
}
