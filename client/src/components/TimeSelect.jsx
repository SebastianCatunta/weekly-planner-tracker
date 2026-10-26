import { useState } from "react";
import { messages } from "../messages/es.js";
import { HOUR_OPTIONS, MINUTE_OPTIONS, joinTime, splitTime } from "../utils/timeOptions.js";

// 001/RF-3.7
// Two lists (hour 00-23, minutes 00-59), so an out-of-range time cannot be typed. Both start with
// no selection. It reports "HH:MM", or "" while either part is missing.
// It keeps the half-chosen state itself; to reset it from outside, change its `key`.
export default function TimeSelect({ label, value = "", onChange }) {
  const [parts, setParts] = useState(() => splitTime(value));

  function update(next) {
    setParts(next);
    onChange(joinTime(next.hour, next.minute));
  }

  return (
    <span className="time-select">
      <select
        aria-label={`${label}: ${messages.form.hour}`}
        value={parts.hour}
        onChange={(event) => update({ ...parts, hour: event.target.value })}
      >
        <option value="">{messages.form.emptyOption}</option>
        {HOUR_OPTIONS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span aria-hidden="true">:</span>
      <select
        aria-label={`${label}: ${messages.form.minute}`}
        value={parts.minute}
        onChange={(event) => update({ ...parts, minute: event.target.value })}
      >
        <option value="">{messages.form.emptyOption}</option>
        {MINUTE_OPTIONS.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </span>
  );
}
