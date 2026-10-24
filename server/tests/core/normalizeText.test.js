import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeText } from "../../src/core/normalizeText.js";

test("001/RF-3.1 normalizeText removes spaces at the start and the end", () => {
  assert.equal(normalizeText("  Estudiar  "), "Estudiar");
});

test("001/RF-3.1 normalizeText reduces repeated spaces between words to one", () => {
  assert.equal(normalizeText("Estudiar    inglés"), "Estudiar inglés");
  assert.equal(normalizeText("  Estudiar   inglés  hoy "), "Estudiar inglés hoy");
});

test("001/RF-3.2 normalizeText turns a text of only spaces into an empty text", () => {
  assert.equal(normalizeText("     "), "");
  assert.equal(normalizeText(""), "");
});

test("001/RF-3.1 normalizeText keeps accents and ñ untouched", () => {
  assert.equal(normalizeText(" Niño  canción "), "Niño canción");
});

test("001/RF-3.2 normalizeText treats a missing or non-text value as empty", () => {
  assert.equal(normalizeText(undefined), "");
  assert.equal(normalizeText(null), "");
  assert.equal(normalizeText(42), "");
});
