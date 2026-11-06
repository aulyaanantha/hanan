import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
function readModule(path) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports });
  return exports;
}
const { filterSavedPlaces } = readModule('lib/places/filter.ts');
const { createPanelScrollLock } = readModule('lib/places/panel-scroll.ts');
const places = [
  { category: 'cafe', place_name: 'Coffee Corner', custom_name: 'Our first date', formatted_address: 'Batam Center' },
  { category: 'food', place_name: 'Noodle House', custom_name: null, formatted_address: null },
];
test('saved-place search matches original name, custom name, and address', () => {
  for (const query of [' COFFEE ', 'first date', 'batam']) assert.equal(filterSavedPlaces(places, query, 'all')[0], places[0]);
});
test('search and category combine without altering the saved list', () => {
  assert.equal(filterSavedPlaces(places, 'coffee', 'food').length, 0);
  assert.equal(filterSavedPlaces(places, '', 'food')[0], places[1]);
  assert.equal(filterSavedPlaces(places, '', 'all').length, 2);
  assert.equal(places.length, 2);
});
test('no results and null metadata are safe', () => {
  assert.equal(filterSavedPlaces(places, 'missing', 'all').length, 0);
  assert.equal(filterSavedPlaces([], '', 'all').length, 0);
});
test('nested panels keep scrolling locked until both have closed', () => {
  const lock = createPanelScrollLock(); const body = { style: { overflow: 'auto' } };
  const closeDetail = lock(body); const closeForm = lock(body);
  assert.equal(body.style.overflow, 'hidden');
  closeForm(); assert.equal(body.style.overflow, 'hidden');
  closeDetail(); assert.equal(body.style.overflow, 'auto');
});
test('route teardown order and repeated cleanup preserve original scrolling', () => {
  const lock = createPanelScrollLock(); const body = { style: { overflow: '' } };
  const closeDetail = lock(body); const closeForm = lock(body);
  closeDetail(); closeDetail(); assert.equal(body.style.overflow, 'hidden');
  closeForm(); assert.equal(body.style.overflow, '');
  const closeAgain = lock(body); closeAgain(); assert.equal(body.style.overflow, '');
});

test('search and category controls render outside the reload button', () => {
  const exports = {};
  const require = createRequire(import.meta.url);
  const maps = {
    APIProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    Map: ({ children }) => React.createElement('div', null, children),
    useMap: () => null, useMapsLibrary: () => null,
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/places/MemoryMap.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, {
    exports, process: { env: { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-only' } },
    require: name => name === '@vis.gl/react-google-maps' ? maps
      : name === '@/lib/places/filter' ? { filterSavedPlaces }
      : name.startsWith('@/components/') ? { __esModule: true, default: () => null } : require(name),
  });
  const html = renderToStaticMarkup(React.createElement(exports.default));
  assert.match(html, /aria-label="Search saved places"/);
  assert.match(html, /Filter saved places/);
  for (const button of html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)) {
    assert.doesNotMatch(button[0], /<input|<button\b[^>]*>[\s\S]*<button\b/);
  }
});
