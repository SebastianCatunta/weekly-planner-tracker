import { test } from "node:test";
import assert from "node:assert/strict";
import { describeRejection } from "../src/utils/formErrors.js";
import { EMPTY_VALUES, formReducer, initialFormState } from "../src/hooks/formState.js";

const failure = (code, extra = {}) => ({ ok: false, code, details: [], fields: [], conflicts: [], ...extra });
const filled = { name: "Estudiar", category: "Estudio", day: "monday", start: "18:00", end: "20:00" };

test("several invalid fields show all the messages at once", () => {
  const result = describeRejection(
    failure("VALIDATION_FAILED", {
      details: [
        { code: "NAME_REQUIRED", fields: ["name"] },
        { code: "END_NOT_AFTER_START", fields: ["end"] },
        { code: "TEXT_NOT_ALLOWED", fields: ["category"] },
      ],
    }),
  );
  assert.equal(result.messages.length, 3);
  assert.match(result.messages[0], /nombre/i);
  assert.match(result.messages[1], /00:00 marca el fin del día/);
  assert.match(result.messages[2], /Categoría/);
  assert.deepEqual(result.fields, ["name", "end", "category"]);
});

test("an overlap names every conflicting activity and empties day, start and end", () => {
  const conflicts = [
    { id: "1", name: "Estudiar", start: "18:00", end: "20:00" },
    { id: "2", name: "Leer", start: "19:00", end: "21:00" },
  ];
  const result = describeRejection(failure("OVERLAP", { fields: ["day", "start", "end"], conflicts }));
  assert.equal(result.messages.length, 1);
  assert.match(result.messages[0], /Estudiar/);
  assert.match(result.messages[0], /Leer/);
  assert.deepEqual(result.fields, ["day", "start", "end"]);
});

test("a duplicate says it is a duplicate and an overlap, and asks to check the schedule", () => {
  const conflicts = [{ id: "1", name: "Estudiar", start: "18:00", end: "20:00" }];
  const [text] = describeRejection(failure("DUPLICATE_OVERLAP", { fields: ["day", "start", "end"], conflicts })).messages;
  assert.match(text, /duplicado/);
  assert.match(text, /solapa/);
  assert.match(text, /Verifica en el horario semanal/);
});

test("other server errors give one message and empty nothing", () => {
  for (const code of ["INVALID_BODY", "INTERNAL", "SOMETHING_NEW"]) {
    const result = describeRejection(failure(code));
    assert.equal(result.messages.length, 1);
    assert.deepEqual(result.fields, []);
  }
});

test("rejected empties only the listed fields and keeps the others", () => {
  const state = formReducer(
    { ...initialFormState, values: filled },
    { type: "rejected", messages: ["x"], fields: ["name", "end"] },
  );
  assert.deepEqual(state.values, { ...filled, name: "", end: "" });
  assert.equal(state.status, "rejected");
  assert.deepEqual(state.errors, ["x"]);
  assert.deepEqual(state.refill, ["name", "end"]);
  assert.deepEqual(state.timeKeys, { start: 0, end: 1 }, "only the emptied time list restarts");
});

test("an overlap rejection keeps name and category and empties day, start and end", () => {
  const state = formReducer(
    { ...initialFormState, values: filled },
    { type: "rejected", messages: ["x"], fields: ["day", "start", "end"] },
  );
  assert.deepEqual(state.values, { ...EMPTY_VALUES, name: "Estudiar", category: "Estudio" });
});

test("the next submit clears the previous messages", () => {
  let state = formReducer({ ...initialFormState, values: filled }, { type: "rejected", messages: ["x"], fields: ["name"] });
  state = formReducer(state, { type: "submit-started" });
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.refill, []);
});

test("a connection error keeps every field and shows no other messages", () => {
  const state = formReducer({ ...initialFormState, values: filled, errors: ["old"] }, { type: "connection-error" });
  assert.equal(state.status, "connectionError");
  assert.deepEqual(state.values, filled);
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.timeKeys, { start: 0, end: 0 });
});

test("after a connection error, retrying starts a normal save", () => {
  let state = formReducer({ ...initialFormState, values: filled }, { type: "connection-error" });
  state = formReducer(state, { type: "submit-started" });
  assert.equal(state.status, "saving");
  state = formReducer(state, { type: "saved" });
  assert.deepEqual(state.values, EMPTY_VALUES);
});
