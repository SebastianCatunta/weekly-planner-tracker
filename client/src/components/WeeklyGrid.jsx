import { messages } from "../messages/es.js";
import { DAYS } from "../utils/days.js";
import { GRID_HEIGHT_PX, HOURS_PER_DAY, ROW_HEIGHT_PX, hourLabel } from "../utils/gridLayout.js";

const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);

// 001/RF-1.1 to 001/RF-1.5
// 7 columns (Monday to Sunday, day names only) by 24 hour rows of 48 px. The container scrolls.
// With no activities it shows the empty grid and no help text (RF-1.3).
export default function WeeklyGrid({ activities = [] }) {
  return (
    <section className="weekly-grid" aria-label={messages.grid.label}>
      <div className="grid-scroll">
        <div className="grid-header">
          <div className="grid-corner" />
          {DAYS.map((day) => (
            <div key={day} className="day-name">
              {messages.days[day]}
            </div>
          ))}
        </div>

        <div className="grid-body" style={{ height: GRID_HEIGHT_PX }}>
          <div className="time-axis">
            {HOURS.map((hour) => (
              <div key={hour} className="hour-label" style={{ height: ROW_HEIGHT_PX }}>
                {hourLabel(hour)}
              </div>
            ))}
            <div className="hour-label hour-label-end">{hourLabel(HOURS_PER_DAY)}</div>
          </div>

          {DAYS.map((day) => (
            <div key={day} className="day-column" data-day={day} />
          ))}
        </div>
      </div>
    </section>
  );
}
