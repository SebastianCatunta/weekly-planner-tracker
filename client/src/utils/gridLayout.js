// Geometry of the weekly grid only. No business rules.

export const MINUTES_PER_DAY = 1440;
export const HOURS_PER_DAY = 24;
// 001/RF-5.4: at least 48 px per hour, 1152 px in total.
export const ROW_HEIGHT_PX = 48;
export const GRID_HEIGHT_PX = HOURS_PER_DAY * ROW_HEIGHT_PX;

// "00:00" ... "24:00" (24 is the end of the day).
export function hourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}
