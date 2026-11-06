import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/special-dates/anniversary.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { getAnniversaryDetails } = exports;
test('first anniversary counts the leap day in the shared journey', () => {
  const result = getAnniversaryDetails('2023-11-06', '2024-11-06');
  assert.equal(result.years, 1);
  assert.equal(result.days, 366);
  assert.equal(result.anniversary, '1st');
});
test('full years only advance after the original date', () => {
  assert.equal(getAnniversaryDetails('2020-11-06', '2026-11-05').years, 5);
  assert.equal(getAnniversaryDetails('2020-11-06', '2026-11-06').years, 6);
});
test('English anniversary ordinals include teen exceptions', () => {
  for (const [year, ordinal] of [[1, '1st'], [2, '2nd'], [3, '3rd'], [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st']]) {
    assert.equal(getAnniversaryDetails('2000-06-01', `${2000 + year}-06-01`).anniversary, ordinal);
  }
});
test('invalid dates and a celebration before the relationship are safe', () => {
  assert.equal(getAnniversaryDetails('invalid', '2026-11-06'), null);
  assert.equal(getAnniversaryDetails('2020-02-30', '2026-11-06'), null);
  assert.equal(getAnniversaryDetails('2027-11-06', '2026-11-06'), null);
});
