import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, mocks = {}, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, console, ...extra });
  return exports;
}
const calendar = load('lib/celebrations/calendar.ts');
test('celebration date uses Jakarta rather than UTC', () => {
  assert.equal(calendar.jakartaDate(new Date('2026-12-31T17:00:00Z')), '2027-01-01');
  assert.equal(calendar.jakartaDate(new Date('2026-12-31T16:59:59Z')), '2026-12-31');
});
test('Eid has a warm greeting and other religious dates use neutral wording', () => {
  assert.match(calendar.celebrationMessage('Hari Raya Idul Fitri').body, /blessings/);
  assert.equal(calendar.celebrationMessage('Hari Raya Natal').body, 'Today is Hari Raya Natal. ❤️');
});
test('concurrent notification runs claim each recipient only once', async () => {
  const claimed = new Set(), sent = [];
  const today = calendar.jakartaDate();
  const db = { from(table) { return table === 'special_days' ? { select() { const query = { eq() { return query; }, then(resolve) { resolve({ data: [{ id: 5, name: 'Earth Day', date: today }] }); } }; return query; } } : { async insert(row) { const key = `${row.special_day_id}:${row.occurrence_date}:${row.person}`; if (claimed.has(key)) return { error: { code: '23505' } }; claimed.add(key); return { error: null }; } }; } };
  const notifications = load('lib/notifications/celebration.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: () => db },
    '@/lib/celebrations/calendar': calendar,
    '@/lib/notifications/send': { sendNotificationToPerson: async (person, payload) => { sent.push({ person, payload }); return { success: true }; } },
  });
  await Promise.all([notifications.sendCelebrationNotifications(), notifications.sendCelebrationNotifications()]);
  assert.equal(sent.length, 2);
  assert.equal(new Set(sent.map(item => item.person)).size, 2);
  assert.ok(sent.every(item => item.payload.ttl >= 0 && item.payload.ttl <= 86400));
});
test('sync updates each year from the source and retains stored data when it fails', async () => {
  const saved = [], updates = [];
  const db = { from() { return { async upsert(rows) { saved.push(rows); return { error: null }; }, update(value) { updates.push(value); const q = { eq() { return q; }, async neq() { return { error: null }; } }; return q; } }; } };
  let fail = false;
  const fetch = async url => {
    if (fail) throw Error('offline');
    const year = Number(new URL(url).searchParams.get('year'));
    return { ok: true, async json() { return Array.from({ length: 5 }, (_, i) => ({ holiday_name: `Holiday ${i}`, holiday_date: `${year}-03-${i + 1}`, is_national_holiday: true })); } };
  };
  const sync = load('lib/celebrations/sync.ts', { 'server-only': {}, '@/lib/supabase/server': { createSupabaseServerClient: () => db }, './calendar': calendar }, { fetch, AbortSignal });
  const result = await sync.syncCelebrations();
  assert.equal(result.success, true); assert.equal(saved.length, 2);
  assert.equal(saved[0][0].date.slice(0, 4), String(Number(calendar.jakartaDate().slice(0, 4))));
  assert.equal(Number(saved[1][0].date.slice(0, 4)), Number(saved[0][0].date.slice(0, 4)) + 1);
  fail = true;
  assert.equal((await sync.syncCelebrations()).success, false);
  assert.equal(saved.length, 2); assert.equal(updates.length, 2);
});
