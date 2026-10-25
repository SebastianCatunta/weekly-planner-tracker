import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as core from "../../src/core/index.js";

const coreDir = fileURLToPath(new URL("../../src/core/", import.meta.url));
const sourceFiles = readdirSync(coreDir).filter((file) => file.endsWith(".js"));

test("constitution 3: core/index.js exports the public functions", () => {
  const functions = [
    "parseMinutes",
    "endToMinutes",
    "formatMinutes",
    "normalizeText",
    "validateTextField",
    "validateSchedule",
    "validateActivity",
    "overlaps",
    "findConflicts",
  ];
  for (const name of functions) {
    assert.equal(typeof core[name], "function", `core should export ${name}`);
  }
  assert.equal(core.DAYS.length, 7);
});

test("constitution 3: core has no reference to express, mongodb, document, window or localStorage", () => {
  const forbidden = /\b(express|mongodb|document|window|localStorage)\b/i;
  for (const file of sourceFiles) {
    const source = readFileSync(path.join(coreDir, file), "utf8");
    assert.equal(forbidden.test(source), false, `${file} must stay pure`);
  }
});

test("constitution 2: every function in core has a // 001/RF-x comment above it", () => {
  for (const file of sourceFiles.filter((name) => name !== "index.js")) {
    const lines = readFileSync(path.join(coreDir, file), "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!/^(export )?function /.test(line)) return;
      let cursor = index - 1;
      let found = false;
      while (cursor >= 0 && lines[cursor].startsWith("//")) {
        if (/001\/RF-\d/.test(lines[cursor])) found = true;
        cursor -= 1;
      }
      assert.ok(found, `${file}:${index + 1} is missing its // 001/RF-x comment`);
    });
  }
});

test("constitution 4: every function file in core has its test file", () => {
  const testDir = fileURLToPath(new URL("./", import.meta.url));
  const testFiles = readdirSync(testDir);
  for (const file of sourceFiles.filter((name) => name !== "index.js")) {
    const expected = file.replace(".js", ".test.js");
    assert.ok(testFiles.includes(expected), `${file} needs ${expected}`);
  }
});
