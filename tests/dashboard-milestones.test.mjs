import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
const source = ts.transpileModule(fs.readFileSync('lib/dashboard-milestones.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
vm.runInNewContext(source, { exports });
const { getNewMilestone } = exports;
for (const threshold of [25, 50, 75, 100]) {
  test(`celebrate crossing ${threshold}% once`, () => {
    assert.equal(getNewMilestone(threshold, threshold - 25), threshold);
    assert.equal(getNewMilestone(threshold, threshold), null);
  });
}
test('no celebration below the first milestone', () => {
  assert.equal(getNewMilestone(24.99, 0), null);
  assert.equal(getNewMilestone(-20, 0), null);
});
test('jumping multiple milestones celebrates only the highest', () => {
  assert.equal(getNewMilestone(80, 0), 75);
  assert.equal(getNewMilestone(150, 25), 100);
});
test('withdrawal and recovery do not repeat celebrated milestones', () => {
  assert.equal(getNewMilestone(30, 75), null);
  assert.equal(getNewMilestone(75, 75), null);
  assert.equal(getNewMilestone(100, 75), 100);
});
test('invalid progress never celebrates', () => {
  assert.equal(getNewMilestone(NaN, 0), null);
  assert.equal(getNewMilestone(Infinity, 0), null);
});
