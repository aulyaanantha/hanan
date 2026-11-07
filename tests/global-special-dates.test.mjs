import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function load(file, mocks = {}, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => name in mocks ? mocks[name] : require(name), ...extra });
  return exports;
}
const dateUtils = load('lib/special-dates/date-utils.ts');
const birthday = load('lib/special-dates/birthday.ts');
const { buildSpecialDateEffects } = load('lib/special-dates/experience.ts', { './date-utils': dateUtils, './birthday': birthday });
const base = { id: 'date', title: 'A little date', date: '2026-11-07', repeat_type: 'none', type: 'custom', icon: null, is_featured: false };
test('ordinary date can celebrate today without any route-specific data', () => {
  const effect = buildSpecialDateEffects([base], '2026-11-07')[0];
  assert.equal(effect.isToday, true); assert.equal(effect.title, base.title); assert.equal(effect.icon, 'calendar');
  assert.equal(effect.birthday, undefined); assert.equal(effect.anniversary, undefined);
});
test('global birthday keeps the birth date needed for personalized messages', () => {
  const effect = buildSpecialDateEffects([{ ...base, title: "Farhan's Birthday", date: '2006-02-20', repeat_type: 'yearly', is_featured: true }], '2027-02-20')[0];
  assert.equal(effect.isToday, true); assert.equal(effect.birthday.name, 'Farhan'); assert.equal(effect.birthday.birthDate, '2006-02-20');
});
test('anniversary keeps its original relationship date', () => {
  const effect = buildSpecialDateEffects([{ ...base, title: 'Our Anniversary', type: 'anniversary', is_featured: true, date: '2025-06-10', repeat_type: 'yearly' }], '2027-06-10')[0];
  assert.equal(effect.isToday, true); assert.equal(effect.anniversary.startDate, '2025-06-10');
});
test('future and past one-off dates never trigger a popup today', () => {
  assert.equal(buildSpecialDateEffects([{ ...base, date: '2026-11-06' }], '2026-11-07')[0].isToday, false);
  assert.equal(buildSpecialDateEffects([{ ...base, date: '2026-11-08' }], '2026-11-07')[0].isToday, false);
});
test('monthly recurring dates are included in the global celebration', () => {
  assert.equal(buildSpecialDateEffects([{ ...base, date: '2025-01-07', repeat_type: 'monthly' }], '2026-11-07')[0].isToday, true);
});
test('card-only mode renders no second dialog and schedules no popup', () => {
  const effects = [];
  const { default: Experience } = load('components/SpecialDatesExperience.tsx', {
    react: { useEffect: effect => effects.push(effect), useState: value => [value, () => {}], useRef: () => ({ current: null }) },
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    './AccessProvider': { useMemberName: () => 'Anantha' },
    '@/lib/hooks/useReducedMotion': { useReducedMotion: () => false },
    '@/lib/special-dates/date-utils': dateUtils,
    '@/lib/special-dates/effects': load('lib/special-dates/effects.ts'),
    './BirthdayGift': { default: () => null }, './AnniversaryBook': { default: () => null },
  });
  assert.equal(Experience({ today: '2026-11-07', dates: buildSpecialDateEffects([base], '2026-11-07'), mode: 'cards' }), null);
  // The popup effect exits before touching timers or browser storage in card-only mode.
  assert.equal(effects[1](), undefined);
});
