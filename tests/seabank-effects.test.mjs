import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/seabank-effects.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const compare = exports.compareSeaBankSnapshots;
const baseline = { balance: 100000, interest: 100, calculationKey: '2026-01-01:.025' };
for (const [name, previous, current, direction, interestIncreased] of [
  ['first visit establishes baseline', null, baseline, null, false],
  ['unchanged visit stays quiet', baseline, baseline, null, false],
  ['increased interest triggers coin and positive flash', baseline, { ...baseline, interest: 125, balance: 100025 }, 'up', true],
  ['deposit without increased interest only highlights balance', baseline, { ...baseline, balance: 150000 }, 'up', false],
  ['withdrawal gives pink highlight', baseline, { ...baseline, balance: 90000 }, 'down', false],
  ['increased interest despite lower balance still triggers coin', baseline, { ...baseline, balance: 90025, interest: 125 }, 'down', true],
  ['sub-rupiah changes do not animate identical displayed amounts', baseline, { ...baseline, balance: 100000.1, interest: 100.1 }, null, false],
  ['new interest settings reset comparison', baseline, { ...baseline, balance: 150000, interest: 200, calculationKey: 'new' }, null, false],
  ['corrupt stored values are ignored', { ...baseline, interest: '100' }, baseline, null, false],
  ['non-finite values are ignored', baseline, { ...baseline, balance: Infinity }, null, false],
]) {
  test(name, () => {
    const result = compare(previous, current);
    assert.equal(result.direction, direction);
    assert.equal(result.interestIncreased, interestIncreased);
  });
}
