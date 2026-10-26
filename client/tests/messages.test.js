import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { messages } from "../src/messages/es.js";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

test("has the names of the 7 days, Monday to Sunday", () => {
  assert.deepEqual(Object.keys(messages.days), DAYS);
  assert.deepEqual(Object.values(messages.days), [
    "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
  ]);
});

test("has the form labels", () => {
  for (const key of ["name", "category", "day", "start", "end", "save"]) {
    assert.equal(typeof messages.form[key], "string", key);
    assert.notEqual(messages.form[key], "");
  }
});

test("has the exact texts required by the spec", () => {
  assert.equal(messages.connectionError, "No se pudo guardar por fallas de conexión");
  assert.equal(messages.loading, "Cargando tus actividades");
  assert.equal(
    messages.loadFailed,
    "Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto.",
  );
  assert.equal(typeof messages.saved, "string");
});

test("has a translation for every code of section 4 of the plan", () => {
  const details = [
    "NAME_REQUIRED", "CATEGORY_REQUIRED", "DAY_REQUIRED", "START_REQUIRED", "END_REQUIRED",
    "NAME_TOO_LONG", "CATEGORY_TOO_LONG", "TEXT_NOT_ALLOWED", "DAY_INVALID", "TIME_INVALID",
    "END_NOT_AFTER_START",
  ];
  const top = [
    "VALIDATION_FAILED", "OVERLAP", "DUPLICATE_OVERLAP", "DB_UNAVAILABLE", "INVALID_BODY",
    "INTERNAL", "DATA_CORRUPT",
  ];
  for (const code of details) assert.ok(messages.validation[code], code);
  for (const code of top) assert.ok(messages.errors[code], code);
});

test("OVERLAP and DUPLICATE_OVERLAP accept the list of conflicting activities and name all of them", () => {
  const conflicts = [
    { id: "1", name: "Estudiar", start: "18:00", end: "20:00" },
    { id: "2", name: "Leer", start: "19:00", end: "21:00" },
  ];
  for (const code of ["OVERLAP", "DUPLICATE_OVERLAP"]) {
    const text = messages.errors[code](conflicts);
    assert.match(text, /Estudiar/);
    assert.match(text, /Leer/);
    assert.match(text, /18:00/);
  }
  assert.match(messages.errors.DUPLICATE_OVERLAP(conflicts), /duplicado/);
  assert.match(messages.errors.DUPLICATE_OVERLAP(conflicts), /solapa/);
  assert.match(messages.errors.DUPLICATE_OVERLAP(conflicts), /Verifica/);
});

// Principle 6: no visible text outside messages/es.js. This looks for text written directly in
// the JSX of the components (between tags, or in text attributes).
function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "messages" ? [] : sourceFiles(path);
    return /\.(jsx|js)$/.test(name) ? [path] : [];
  });
}

test("no visible text is written in the components", () => {
  const offenders = [];
  for (const file of sourceFiles(new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
    const code = readFileSync(file, "utf8");
    // Text between tags: >Hello<  (JSX expressions {…} are fine)
    for (const match of code.matchAll(/>([^<>{}\n]*[A-Za-zÁ-ú]{2,}[^<>{}\n]*)</g)) offenders.push([file, match[1].trim()]);
    // Literal text attributes
    for (const match of code.matchAll(/\b(?:aria-label|title|placeholder|alt)="([^"]*[A-Za-zÁ-ú]{2,}[^"]*)"/g)) {
      offenders.push([file, match[1]]);
    }
  }
  assert.deepEqual(offenders, []);
});
