import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, console: { error() {}, warn() {}, log() {} }, require: name => {
    assert.ok(name in mocks, `Unexpected dependency ${name}`); return mocks[name];
  } });
  return exports;
}
function payments({ authorized = true, saveError = false, send } = {}) {
  const jobs = []; let saved = false; let targetChecked = false;
  const route = load('app/api/payments/route.ts', {
    'next/server': { after: job => jobs.push(job), NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
    '@/lib/session/server': { getAuthenticatedMember: async () => authorized ? { displayName: 'Anantha' } : null },
    '@/lib/supabase/server': { createSupabaseServerClient: () => ({ from(table) {
      if (table === 'weeks') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'week', week_number: 1 } }) }) }) };
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
        insert: async () => { saved = !saveError; return { error: saveError ? {} : null }; } };
    } }) },
    '@/lib/notifications/send': { sendNotificationToPerson: send ?? (async () => ({ success: true })) },
    '@/lib/notifications/target': { checkAndSendTargetNotification: async () => { targetChecked = true; } },
  });
  return { route, jobs, saved: () => saved, targetChecked: () => targetChecked };
}
const request = () => ({ json: async () => ({ weekId: 'week', amount: 25000, paymentDate: '2026-11-07' }) });

test('saved-payment response does not wait for a slow push service', async () => {
  let finishPush; let pushStarted = false;
  const slowPush = new Promise(resolve => { finishPush = resolve; });
  const s = payments({ send: async () => { pushStarted = true; return slowPush; } });
  const response = await s.route.POST(request());
  assert.equal(response.status, 200); assert.equal(s.saved(), true);
  assert.equal(pushStarted, false); assert.equal(s.jobs.length, 1);
  const background = s.jobs[0]();
  assert.equal(pushStarted, true); assert.equal(s.targetChecked(), true, 'target check should run independently');
  finishPush({ success: true }); await background;
});
test('push failure after the response never changes a saved payment into an error', async () => {
  const s = payments({ send: async () => { throw Error('push offline'); } });
  const response = await s.route.POST(request());
  await s.jobs[0]();
  assert.equal(response.body.success, true); assert.equal(s.saved(), true); assert.equal(s.targetChecked(), true);
});
test('failed saves never schedule a notification', async () => {
  const s = payments({ saveError: true });
  assert.equal((await s.route.POST(request())).status, 500); assert.equal(s.jobs.length, 0);
});
test('unauthenticated writes are still rejected before save and notification work', async () => {
  const s = payments({ authorized: false });
  assert.equal((await s.route.POST(request())).status, 401); assert.equal(s.saved(), false); assert.equal(s.jobs.length, 0);
});
test('API proxy avoids duplicate Auth requests and retains private cache headers', async () => {
  const { proxy } = load('proxy.ts', {
    '@supabase/ssr': { createServerClient: () => { throw Error('API route must perform its own validation'); } },
    'next/server': { NextResponse: { next: () => ({ headers: new Map() }) } },
    '@/lib/supabase/auth-config': { getSupabaseAuthConfig: () => { throw Error('Unnecessary config read'); } },
  });
  assert.equal((await proxy({ nextUrl: { pathname: '/api/payments' } })).headers.get('Cache-Control'), 'private, no-store');
});
