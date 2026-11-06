import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function recapView({ slide = 0, hasMemories = true } = {}) {
  const values = [slide, 'next', 0, false, false, 0, 0, false, true];
  const updates = new Map();
  let cursor = 0, scroll = 0;
  const data = {
    monthLabel: 'October 2026', saved: 100000, spent: 25000, previousSaved: 50000,
    growthPercentage: 100, largestExpense: null, savingWeeks: 4, goalProgress: 25,
    balanceAtEndOfMonth: 75000, specialDates: [],
    memories: hasMemories ? [{ id: 'memory', imagePath: 'photo.jpg', note: 'Our moment', memoryDate: '2026-10-15' }] : [],
  };
  const mockedReact = {
    ...React,
    useState: () => { const index = cursor++; return [values[index], value => updates.set(index, value)]; },
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: () => {},
  };
  const mocks = {
    react: mockedReact, 'react/jsx-runtime': runtime,
    'next/navigation': { useRouter: () => ({ push: () => {} }) },
    'lucide-react': { ArrowLeft: () => null, ArrowRight: () => null, X: () => null, CalendarDays: () => null },
    '@/components/ContributionHearts': { default: () => runtime.jsx('span', { children: 'Together' }) },
    '@/lib/hooks/useReducedMotion': { useReducedMotion: () => false },
    '@/components/recap/AnimatedCounter': { default: ({ value }) => runtime.jsx('span', { children: value }) },
  };
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync('components/MonthlyRecap.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; },
    window: { innerWidth: 390, matchMedia: () => ({ matches: true }) },
    document: { querySelector: () => ({ scrollTop: scroll }) }, performance: { now: () => 100 },
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } },
  });
  const tree = exports.default({ recap: data });
  const pointer = (x, y = 100, interactive = false) => ({
    isPrimary: true, pointerType: 'touch', clientX: x, clientY: y,
    target: { closest: () => interactive ? {} : null },
  });
  return { tree, updates, pointer, setScroll: value => { scroll = value; } };
}

for (let slide = 0; slide < 7; slide++) {
  test(`chapter ${slide}: only one scene is mounted`, () => {
    const { tree } = recapView({ slide });
    const html = renderToStaticMarkup(tree);
    assert.equal((html.match(/<section\b/g) ?? []).length, 1);
    assert.ok(html.includes('recap-stage'));
  });
}
test('without memories, summary is still reachable at the final index', () => {
  const html = renderToStaticMarkup(recapView({ slide: 5, hasMemories: false }).tree);
  assert.ok(html.includes('Share Recap'));
  assert.equal((html.match(/<section\b/g) ?? []).length, 1);
});
for (const [x, expected] of [[50, 1], [350, 3]]) {
  test(`mobile tap ${x < 195 ? 'left goes back' : 'right goes forward'}`, () => {
    const v = recapView({ slide: 2 });
    v.tree.props.onPointerDown(v.pointer(x));
    v.tree.props.onPointerUp(v.pointer(x));
    assert.equal(v.updates.get(0), expected);
  });
}
for (const [slide, x] of [[0, 50], [6, 350]]) {
  test(`tap at boundary ${slide} stays in range`, () => {
    const v = recapView({ slide });
    v.tree.props.onPointerDown(v.pointer(x)); v.tree.props.onPointerUp(v.pointer(x));
    assert.equal(v.updates.has(0), false);
  });
}
test('tapping controls does not trigger slide navigation', () => {
  const v = recapView({ slide: 2 });
  v.tree.props.onPointerDown(v.pointer(350, 100, true)); v.tree.props.onPointerUp(v.pointer(350, 100, true));
  assert.equal(v.updates.has(0), false);
});
test('vertical scroll does not navigate', () => {
  const v = recapView({ slide: 2 });
  v.tree.props.onPointerDown(v.pointer(350)); v.setScroll(100); v.tree.props.onPointerUp(v.pointer(350, 60));
  assert.equal(v.updates.has(0), false);
});
test('horizontal swipe navigates once', () => {
  const v = recapView({ slide: 2 });
  v.tree.props.onPointerDown(v.pointer(300)); v.tree.props.onPointerUp(v.pointer(100));
  assert.equal(v.updates.get(0), 3);
});
test('cancelled touch does not navigate', () => {
  const v = recapView({ slide: 2 });
  v.tree.props.onPointerDown(v.pointer(300)); v.tree.props.onPointerCancel(); v.tree.props.onPointerUp(v.pointer(300));
  assert.equal(v.updates.has(0), false);
});
