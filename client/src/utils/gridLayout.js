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

// 001/RF-5.4
// A block is never shorter than this, so even a 1-minute activity shows its name.
export const MIN_BLOCK_PX = 20;

const EPSILON = 0.001;

// 001/RF-1.2, 001/RF-5.1, 001/RF-5.2, 001/RF-5.4
// Position of the blocks of ONE day, in pixels inside the day column:
//   top    = startMinute / 1440 of the grid height
//   height = (endMinute - startMinute) / 1440 of the grid height, at least MIN_BLOCK_PX
// If a block would touch the previous one (which happens with minimum-height blocks), it is moved
// down so they never overlap. Activities that only touch at the edge stay where they are.
export function layoutDay(activities) {
  const ordered = [...activities].sort((a, b) => a.startMinute - b.startMinute);
  let previousBottom = 0;

  return ordered.map((activity) => {
    const naturalTop = (activity.startMinute / MINUTES_PER_DAY) * GRID_HEIGHT_PX;
    const height = Math.max(
      MIN_BLOCK_PX,
      ((activity.endMinute - activity.startMinute) / MINUTES_PER_DAY) * GRID_HEIGHT_PX,
    );
    const top = naturalTop < previousBottom - EPSILON ? previousBottom : naturalTop;
    previousBottom = top + height;
    return { activity, top, height };
  });
}

// The grid is at least 1152 px tall; it grows only if shifted blocks end below the last row.
export function gridHeight(layouts) {
  const lowest = layouts.reduce((max, { top, height }) => Math.max(max, top + height), 0);
  return Math.max(GRID_HEIGHT_PX, Math.ceil(lowest));
}
