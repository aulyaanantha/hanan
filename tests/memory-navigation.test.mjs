import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/memory-navigation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { getAdjacentMemory, getMemorySwipeDirection } = exports;
const memories = [{ id: 'newest' }, { id: 'middle' }, { id: 'oldest' }];
test('next and previous follow displayed photo order', () => {
  assert.equal(getAdjacentMemory(memories, 'middle', 1).id, 'oldest');
  assert.equal(getAdjacentMemory(memories, 'middle', -1).id, 'newest');
});
test('endpoints do not wrap to an unrelated photo', () => {
  assert.equal(getAdjacentMemory(memories, 'newest', -1), null);
  assert.equal(getAdjacentMemory(memories, 'oldest', 1), null);
});
test('deleted or missing selection is safe', () => {
  assert.equal(getAdjacentMemory(memories, 'deleted', 1), null);
  assert.equal(getAdjacentMemory([], 'newest', 1), null);
});
test('single photo has no adjacent memory', () => {
  assert.equal(getAdjacentMemory([{ id: 'only' }], 'only', -1), null);
  assert.equal(getAdjacentMemory([{ id: 'only' }], 'only', 1), null);
});
for (const [name, dx, dy, expected] of [
  ['left swipe opens next', -90, 8, 1],
  ['right swipe opens previous', 90, 8, -1],
  ['tap does not switch photos', 0, 0, null],
  ['short drag does not switch photos', -30, 2, null],
  ['vertical scrolling does not switch photos', 5, -100, null],
  ['diagonal scrolling does not switch photos', -90, -60, null],
]) test(name, () => assert.equal(getMemorySwipeDirection(dx, dy), expected));
