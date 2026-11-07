import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';

function load(file, mocks, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, console: { log() {}, info() {}, warn() {}, error() {} },
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...extra });
  return exports;
}
function sender(plans, queryError = false) {
  const calls = [], removed = [];
  const devices = plans.map((_, i) => ({ id: String(i), endpoint: `https://push.test/${i}`, p256dh: 'key', auth: 'auth' }));
  const db = { from: () => ({ select: () => ({ eq: async () => ({ data: devices, error: queryError ? {} : null }) }),
    delete: () => ({ eq: async (_key, id) => { removed.push(id); return { error: null }; } }) }) };
  const { sendNotificationToPerson } = load('lib/notifications/send.ts', {
    'server-only': {}, 'node:crypto': crypto, '@/lib/supabase/server': { createSupabaseServerClient: () => db },
    '@/lib/notifications/web-push': { webpush: { sendNotification: async (subscription, payload, options) => {
      const id = Number(subscription.endpoint.split('/').at(-1));
      calls.push({ id, payload: JSON.parse(payload), options });
      const status = plans[id].shift(); if (status) throw { statusCode: status };
    } } },
  }, { setTimeout: callback => { callback(); } });
  return { run: () => sendNotificationToPerson('Anantha', { title: 'Today', body: 'A moment', tag: 'event:today' }), calls, removed };
}
test('no devices and device query errors are not successful delivery', async () => {
  assert.equal((await sender([]).run()).success, false);
  assert.equal((await sender([[0]], true).run()).success, false);
});
test('transient failures retry and reuse the same topic', async () => {
  const s = sender([[503, 429, 0]]); const result = await s.run();
  assert.equal(result.success, true); assert.equal(s.calls.length, 3);
  assert.equal(new Set(s.calls.map(call => call.options.topic)).size, 1);
  assert.equal(s.calls[0].options.timeout, 5000);
  assert.equal(s.calls[0].payload.tag, 'event:today');
});
test('permanent authorization failures do not retry or delete subscriptions', async () => {
  const s = sender([[403]]); assert.equal((await s.run()).success, false);
  assert.equal(s.calls.length, 1); assert.equal(s.removed.length, 0);
});
test('expired devices are removed while valid devices continue', async () => {
  const s = sender([[410], [0]]); const result = await s.run();
  assert.equal(result.success, true); assert.equal(result.expired, 1); assert.equal(result.sent, 1);
  assert.equal(s.removed[0], '0');
});
test('one successful device never hides another device failure', async () => {
  const s = sender([[0], [503, 503, 503]]); const result = await s.run();
  assert.equal(result.success, false); assert.equal(result.sent, 1); assert.equal(result.failed, 1);
});

class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-11-07T05:00:00Z'])); } }
const dates = load('lib/special-dates/date-utils.ts', {}, { Date: FixedDate });
function specialScenario(deliveries, existing = false) {
  let logged = existing; const sent = [];
  const db = { from(table) {
    if (table === 'special_dates') return { select: async () => ({ data: [{ id: 'event', title: 'Badminton', date: '2026-11-07', type: 'custom', repeat_type: 'none' }] }) };
    return { select() { const query = { eq: () => query, maybeSingle: async () => ({ data: logged ? { id: 'log' } : null }) }; return query; },
      insert: async () => { logged = true; return { error: null }; } };
  } };
  const { sendSpecialDateNotifications } = load('lib/notifications/special-date.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: () => db },
    '@/lib/special-dates/date-utils': dates,
    '@/lib/notifications/send': { sendNotificationToPerson: async person => { sent.push(person); return deliveries[person]; } },
  }, { Date: FixedDate });
  return { run: sendSpecialDateNotifications, logged: () => logged, sent };
}
const accepted = { success: true, sent: 1, failed: 0 };
const failed = { success: false, sent: 0, failed: 1 };
test('partial recipient delivery stays pending and can be retried', async () => {
  const deliveries = { Anantha: accepted, Farhan: failed }; const s = specialScenario(deliveries);
  assert.equal((await s.run()).pending, 1); assert.equal(s.logged(), false);
  deliveries.Farhan = accepted;
  assert.equal((await s.run()).completed, 1); assert.equal(s.logged(), true);
  assert.equal((await s.run()).skipped, 1); assert.equal(s.sent.length, 4);
});
test('both recipients must succeed before saving a special-date log', async () => {
  const s = specialScenario({ Anantha: accepted, Farhan: accepted });
  assert.equal((await s.run()).completed, 1); assert.equal(s.sent.length, 2);
});
test('one failed notification job does not block the other jobs', async () => {
  let payments = false, target = false;
  const daily = load('lib/notifications/daily.ts', {
    './special-date': { sendSpecialDateNotifications: async () => { throw Error('database unavailable'); } },
    './payment-reminder': { sendPaymentReminders: async () => { payments = true; return { pending: 0 }; } },
    './target': { checkAndSendTargetNotification: async () => { target = true; } },
  });
  const result = await daily.runDailyNotifications();
  assert.equal(result.success, false); assert.equal(payments, true); assert.equal(target, true);
});
test('pending deliveries make the job result fail visibly', async () => {
  const daily = load('lib/notifications/daily.ts', {
    './special-date': { sendSpecialDateNotifications: async () => ({ pending: 1 }) },
    './payment-reminder': { sendPaymentReminders: async () => ({ pending: 0 }) },
    './target': { checkAndSendTargetNotification: async () => ({ pending: 0 }) },
  });
  assert.equal((await daily.runDailyNotifications()).success, false);
});

test('cron rejects unauthorized calls before sending and exposes incomplete delivery', async () => {
  let calls = 0;
  const route = load('app/api/notifications/daily/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
    '@/lib/notifications/daily': { runDailyNotifications: async () => { calls++; return { success: false }; } },
  }, { process: { env: { CRON_SECRET: 'test-secret' } } });
  assert.equal((await route.GET({ headers: { get: () => null } })).status, 401);
  assert.equal(calls, 0);
  assert.equal((await route.GET({ headers: { get: () => 'Bearer test-secret' } })).status, 503);
  assert.equal(calls, 1);
});
test('catch-up cannot be triggered without a valid HANAN member session', async () => {
  const route = load('app/api/notifications/check/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
    '@/lib/session/server': { isAuthenticated: async () => false },
    '@/lib/notifications/daily': { runDailyNotifications: async () => { throw Error('Must not send'); } },
  });
  assert.equal((await route.POST()).status, 401);
});
test('target notification remains eligible when either partner has no delivery', async () => {
  let marked = false;
  const db = { from(table) {
    if (table === 'app_settings') return {
      select() { const q = { limit: () => q, single: async () => ({ data: { id: 'settings', target_amount: 100, target_notification_sent: false } }) }; return q; },
      update: () => ({ eq: async () => { marked = true; return { error: null }; } }),
    };
    return { select: async () => ({ data: table === 'payments' ? [{ amount: 150 }] : [] }) };
  } };
  const target = load('lib/notifications/target.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: () => db },
    '@/lib/notifications/send': { sendNotificationToPerson: async person => person === 'Anantha' ? accepted : failed },
  });
  assert.equal((await target.checkAndSendTargetNotification()).pending, 1);
  assert.equal(marked, false);
});
