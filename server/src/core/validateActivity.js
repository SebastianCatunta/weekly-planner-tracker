import { normalizeText } from "./normalizeText.js";
import { parseMinutes, endToMinutes } from "./timeUtils.js";

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const MAX_TEXT_LENGTH = 30;
// Characters and sequences that could be used against the application (RF-3.8).
const DISALLOWED_TEXT = /[<>{}$;'"`]|--|\/\*|\*\//;

// 001/RF-3.2, 001/RF-3.6, 001/RF-3.8
export function validateTextField(field, rawValue) {
  const value = normalizeText(rawValue);
  const prefix = field.toUpperCase();

  if (value === "") return { value, errors: [{ code: `${prefix}_REQUIRED`, fields: [field] }] };
  if ([...value].length > MAX_TEXT_LENGTH) {
    return { value, errors: [{ code: `${prefix}_TOO_LONG`, fields: [field] }] };
  }
  if (DISALLOWED_TEXT.test(value)) {
    return { value, errors: [{ code: "TEXT_NOT_ALLOWED", fields: [field] }] };
  }
  return { value, errors: [] };
}

// 001/RF-3.3
function isMissing(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

// 001/RF-3.3, 001/RF-3.7
function readTime(field, time, toMinutes, errors) {
  if (isMissing(time)) {
    errors.push({ code: `${field.toUpperCase()}_REQUIRED`, fields: [field] });
    return null;
  }
  const minutes = toMinutes(time);
  if (minutes === null) errors.push({ code: "TIME_INVALID", fields: [field] });
  return minutes;
}

// 001/RF-3.3, 001/RF-3.4, 001/RF-3.5, 001/RF-3.7, 001/RF-3.9
export function validateSchedule(input) {
  const { day, start, end } = input ?? {};
  const errors = [];

  if (isMissing(day)) errors.push({ code: "DAY_REQUIRED", fields: ["day"] });
  else if (!DAYS.includes(day)) errors.push({ code: "DAY_INVALID", fields: ["day"] });

  const startMinute = readTime("start", start, parseMinutes, errors);
  const endMinute = readTime("end", end, endToMinutes, errors);

  if (startMinute !== null && endMinute !== null && endMinute <= startMinute) {
    errors.push({ code: "END_NOT_AFTER_START", fields: ["end"] });
  }

  if (errors.length > 0) return { errors };
  return { value: { day, startMinute, endMinute }, errors };
}
