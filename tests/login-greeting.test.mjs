import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/login-greeting.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { getJakartaGreeting } = exports;
for (const [utc, expected] of [
  ['2026-11-05T21:59:00Z', 'night'],
  ['2026-11-05T22:00:00Z', 'morning'],
  ['2026-11-06T03:59:00Z', 'morning'],
  ['2026-11-06T04:00:00Z', 'afternoon'],
  ['2026-11-06T07:59:00Z', 'afternoon'],
  ['2026-11-06T08:00:00Z', 'evening'],
  ['2026-11-06T10:59:00Z', 'evening'],
  ['2026-11-06T11:00:00Z', 'night'],
  ['2026-11-06T17:00:00Z', 'night'],
]) test(`Jakarta greeting at ${utc} is ${expected}`, () => {
  assert.equal(getJakartaGreeting(new Date(utc)).period, expected);
});
test('the same instant has the same greeting regardless of input timezone', () => {
  assert.equal(getJakartaGreeting(new Date('2026-11-06T07:00:00+07:00')).message,
    getJakartaGreeting(new Date('2026-11-06T00:00:00Z')).message);
});
