import { FIELDS } from "../hooks/formState.js";
import { messages } from "../messages/es.js";

const label = (field) => messages.form[field] ?? field;

// 001/RF-3.10, 001/RF-3.11, 001/RF-4.1, 001/RF-4.4
// Turns a failed API result into what the form shows:
//   messages: every message at once (never only the first)
//   fields:   the fields to empty, which are only the ones the server listed
export function describeRejection(result) {
  if (result.code === "VALIDATION_FAILED" && result.details.length > 0) {
    const texts = result.details.map((detail) => {
      const translation = messages.validation[detail.code];
      if (typeof translation === "function") return translation(detail.fields.map(label));
      return translation ?? messages.errors.VALIDATION_FAILED;
    });
    const fields = result.details.flatMap((detail) => detail.fields).filter((field) => FIELDS.includes(field));
    return { messages: [...new Set(texts)], fields: [...new Set(fields)] };
  }

  const translation = messages.errors[result.code] ?? messages.errors.INTERNAL;
  const text = typeof translation === "function" ? translation(result.conflicts) : translation;
  const fields = result.fields.filter((field) => FIELDS.includes(field));
  return { messages: [text], fields: [...new Set(fields)] };
}
