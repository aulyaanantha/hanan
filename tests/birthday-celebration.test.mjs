import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/special-dates/birthday.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { getBirthdayPerson, getBirthdayAge, getBirthdayMessage } = exports;
test('only the two named birthdays select a birthday recipient', () => {
  assert.equal(getBirthdayPerson("Farhan's Birthday"), 'Farhan');
  assert.equal(getBirthdayPerson('Anantha’s Birthday'), 'Anantha');
  assert.equal(getBirthdayPerson('Our Anniversary'), null);
  assert.equal(getBirthdayPerson('Birthday party'), null);
});
test('age uses birth year and whether birthday has been reached', () => {
  assert.equal(getBirthdayAge('2000-11-06', '2026-11-06'), 26);
  assert.equal(getBirthdayAge('2000-11-06', '2026-11-05'), 25);
  assert.equal(getBirthdayAge('2000-11-06', '2027-11-06'), 27);
});
test('invalid dates and nonpositive ages never appear as an age', () => {
  for (const birth of ['invalid', '2000-02-30', '2026-11-06', '2030-11-06']) {
    assert.equal(getBirthdayAge(birth, '2026-11-06'), null);
  }
});
for (const [name, partner] of [['Farhan', 'Anantha'], ['Anantha', 'Farhan']]) {
  test(`${name} sees personal wording while ${partner} sees partner wording`, () => {
    assert.equal(getBirthdayMessage(name, 26, name), `A year has passed, and you have now reached an age greater than ever before. Happy 26 birthday, ${name}!!`);
    assert.equal(getBirthdayMessage(name, 26, partner), 'Your partner has reached the age of 26 today. May you continue to celebrate their birthday in the years to come.');
  });
}
test('missing birth year has a greeting without a fabricated age', () => {
  assert.equal(getBirthdayMessage('Farhan', null, 'Farhan').includes('Happy birthday, Farhan!!'), true);
  assert.equal(getBirthdayMessage('Farhan', null, 'Anantha').includes('null'), false);
});
