const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 1440;

// 001/RF-3.7
export function parseMinutes(time) {
  if (typeof time !== "string") return null;
  const match = TIME_PATTERN.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// 001/RF-3.4
export function endToMinutes(time) {
  if (time === "00:00") return MINUTES_PER_DAY;
  return parseMinutes(time);
}

// 001/RF-3.4
export function formatMinutes(minutes) {
  const minuteOfDay = minutes % MINUTES_PER_DAY;
  const hours = String(Math.floor(minuteOfDay / 60)).padStart(2, "0");
  const mins = String(minuteOfDay % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}
