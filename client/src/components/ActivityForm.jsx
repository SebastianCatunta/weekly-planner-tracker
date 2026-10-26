import { useReducer } from "react";
import { messages } from "../messages/es.js";
import { DAYS } from "../utils/days.js";
import { formReducer, initialFormState } from "../hooks/formState.js";
import TimeSelect from "./TimeSelect.jsx";

// 001/RF-2.1, 001/RF-2.2
// Five fields that start empty. The day is a single-choice list: one day per registration.
export default function ActivityForm() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const { values } = state;
  const change = (field) => (event) => dispatch({ type: "change", field, value: event.target.value });
  const changeTime = (field) => (value) => dispatch({ type: "change", field, value });

  return (
    <form className="activity-form" noValidate>
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
        <TimeSelect label={messages.form.start} value={values.start} onChange={changeTime("start")} />
      </div>

      <div className="form-field">
        <span>{messages.form.end}</span>
        <TimeSelect label={messages.form.end} value={values.end} onChange={changeTime("end")} />
      </div>

      <button type="submit">{messages.form.save}</button>
    </form>
  );
}
