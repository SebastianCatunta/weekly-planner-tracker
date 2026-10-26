import { validateActivity } from "../core/index.js";

// Builds the service around its dependencies so tests can pass a fake repository.
export function createActivityService({ repository }) {
  // 001/RF-3.9, 001/RF-3.10
  // Fields are checked first: invalid data never reaches the repository.
  async function createActivity(input) {
    const validation = validateActivity(input);
    if (!validation.ok) {
      return { ok: false, code: "VALIDATION_FAILED", details: validation.errors };
    }
    return { ok: true, value: validation.value };
  }

  return { createActivity };
}
