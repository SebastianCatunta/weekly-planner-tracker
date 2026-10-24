import { normalizeText } from "./normalizeText.js";

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
