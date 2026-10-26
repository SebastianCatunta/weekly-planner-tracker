// 001/RF-3.7
// The only values a time field can take: hours 00-23 and minutes 00-59.
const pad = (n) => String(n).padStart(2, "0");

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => pad(hour));
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => pad(minute));

// "HH:MM" when both parts are chosen, "" when either is missing.
export function joinTime(hour, minute) {
  return hour && minute ? `${hour}:${minute}` : "";
}

// Inverse of joinTime for a valid "HH:MM"; anything else gives empty parts.
export function splitTime(value) {
  const [hour = "", minute = ""] = typeof value === "string" ? value.split(":") : [];
  return HOUR_OPTIONS.includes(hour) && MINUTE_OPTIONS.includes(minute) ? { hour, minute } : { hour: "", minute: "" };
}
