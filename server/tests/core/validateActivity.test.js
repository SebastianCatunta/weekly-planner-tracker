import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTextField } from "../../src/core/validateActivity.js";

// ---- Name and category (T-06) ----

test("001/RF-3.2 validateTextField reports NAME_REQUIRED and CATEGORY_REQUIRED when empty after normalizing", () => {
  assert.deepEqual(validateTextField("name", "   ").errors, [{ code: "NAME_REQUIRED", fields: ["name"] }]);
  assert.deepEqual(validateTextField("category", "").errors, [{ code: "CATEGORY_REQUIRED", fields: ["category"] }]);
  assert.deepEqual(validateTextField("name", undefined).errors, [{ code: "NAME_REQUIRED", fields: ["name"] }]);
});

test("001/RF-3.6 validateTextField accepts 30 characters and rejects 31", () => {
  assert.deepEqual(validateTextField("name", "a".repeat(30)).errors, []);
  assert.deepEqual(validateTextField("name", "a".repeat(31)).errors, [{ code: "NAME_TOO_LONG", fields: ["name"] }]);
  assert.deepEqual(validateTextField("category", "a".repeat(31)).errors, [
    { code: "CATEGORY_TOO_LONG", fields: ["category"] },
  ]);
});

test("001/RF-3.6 validateTextField counts the length after normalizing", () => {
  const raw = `${"a".repeat(14)}   ${"b".repeat(15)}`; // 32 characters, 30 once normalized
  const result = validateTextField("name", raw);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value, `${"a".repeat(14)} ${"b".repeat(15)}`);
});

test("001/RF-3.6 validateTextField counts an emoji as one character", () => {
  assert.deepEqual(validateTextField("name", "😀".repeat(30)).errors, []);
  assert.deepEqual(validateTextField("name", "😀".repeat(31)).errors, [{ code: "NAME_TOO_LONG", fields: ["name"] }]);
});

test("001/RF-3.8 validateTextField rejects every disallowed character and sequence", () => {
  const disallowed = ["<", ">", "{", "}", "$", ";", "'", '"', "`", "--", "/*", "*/"];
  for (const item of disallowed) {
    const result = validateTextField("name", `Estudiar ${item} hoy`);
    assert.deepEqual(result.errors, [{ code: "TEXT_NOT_ALLOWED", fields: ["name"] }], `expected ${item} to be rejected`);
  }
  assert.deepEqual(validateTextField("category", "<script>").errors, [
    { code: "TEXT_NOT_ALLOWED", fields: ["category"] },
  ]);
});

test("001/RF-3.8 validateTextField accepts emojis, accents, ñ, digits and normal punctuation", () => {
  for (const accepted of ["Ejercicio 💪", "Niño canción", "Tarea 2", "Leer: capítulo 3 (parte 1)", "Plan - semana", "¿Qué hacer?"]) {
    assert.deepEqual(validateTextField("name", accepted).errors, [], `expected ${accepted} to be accepted`);
  }
});

test("001/RF-3.1 validateTextField returns the normalized value", () => {
  assert.equal(validateTextField("name", "  Estudiar   inglés ").value, "Estudiar inglés");
});
