import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/special-dates/effects.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { readDateEffects, shouldShowDateCelebration } = exports;
test('popup only opens for an event today', () => {
  assert.equal(shouldShowDateCelebration(null, '2026-11-06', []), false);
  assert.equal(shouldShowDateCelebration(null, '2026-11-06', [{ isToday: false }]), false);
  assert.equal(shouldShowDateCelebration(null, '2026-11-06', [{ isToday: false }, { isToday: true }]), true);
});
test('dismissed popup stays dismissed that day and can return on another special day', () => {
  assert.equal(shouldShowDateCelebration('2026-11-06', '2026-11-06', [{ isToday: true }]), false);
  assert.equal(shouldShowDateCelebration('2026-11-06', '2026-11-07', [{ isToday: true }]), true);
});
test('celebration IDs reset at midnight while countdown history survives', () => {
  const raw = JSON.stringify({ day: '2026-11-06', labels: { birthday: '1 day to go' }, celebrated: ['birthday'] });
  assert.equal(readDateEffects(raw, '2026-11-06').celebrated.length, 1);
  assert.equal(readDateEffects(raw, '2026-11-07').celebrated.length, 0);
  assert.equal(readDateEffects(raw, '2026-11-07').labels.birthday, '1 day to go');
});
test('malformed browser storage never prevents rendering', () => {
  for (const raw of [null, 'null', '{', '42']) {
    assert.equal(readDateEffects(raw, '2026-11-06').celebrated.length, 0);
  }
  const result = readDateEffects(JSON.stringify({ day: '2026-11-06', labels: { valid: 'Today!', invalid: 99 }, celebrated: ['valid', null, 5] }), '2026-11-06');
  assert.equal(result.labels.valid, 'Today!');
  assert.equal(result.labels.invalid, undefined);
  assert.equal(result.celebrated.length, 1);
});
