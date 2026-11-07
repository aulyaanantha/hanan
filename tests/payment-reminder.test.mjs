import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function scenario({ delivery, paid = false, reminded = false, throws = false }) {
  const saved = new Set();
  const sent = [];
  const client = { from(table) {
    if (table === 'weeks') {
      const query = { select: () => query, lte: () => query, order: () => query, limit: () => query,
        maybeSingle: async () => ({ data: { id: 'week', week_number: 52 } }) };
      return query;
    }
    let person;
    const query = {
      select: () => query,
      eq(key, value) { if (key === 'person') person = value; return query; },
      maybeSingle: async () => ({ data: (table === 'payments' ? paid : reminded || saved.has(person)) ? { id: 'existing' } : null }),
      insert: async row => { saved.add(row.person); return { error: null }; },
    };
    return query;
  } };
  const exports = {};
  const mocks = {
    '@/lib/supabase/server': { createSupabaseServerClient: () => client },
    '@/lib/notifications/send': { sendNotificationToPerson: async person => {
      sent.push(person);
      if (throws) throw new Error('Network failure');
      return delivery;
    } },
  };
  const source = ts.transpileModule(fs.readFileSync('lib/notifications/payment-reminder.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    return mocks[name];
  }, console: { log() {}, error() {}, warn() {} } });
  return { run: exports.sendPaymentReminders, saved, sent };
}

for (const [name, delivery, recorded] of [
  ['no registered devices', { success: true, sent: 0, failed: 0 }, false],
  ['device query failure', { success: false, sent: 0, failed: 0 }, false],
  ['all pushes failed', { success: false, sent: 0, failed: 2 }, false],
  ['successful push', { success: true, sent: 1, failed: 0 }, true],
  ['one success and one failed device', { success: true, sent: 1, failed: 1 }, false],
]) {
  test(`payment reminder: ${name}`, async () => {
    const s = scenario({ delivery });
    await s.run();
    assert.equal(s.saved.size, recorded ? 2 : 0);
    assert.equal(s.sent.length, 2);
    await s.run();
    assert.equal(s.sent.length, recorded ? 2 : 4, 'Retry only when no successful delivery was recorded');
  });
}
test('thrown delivery errors remain eligible for retry', async () => {
  const s = scenario({ throws: true });
  await s.run();
  await s.run();
  assert.equal(s.saved.size, 0);
  assert.equal(s.sent.length, 4);
});
for (const condition of ['paid', 'reminded']) {
  test(`skip people already ${condition}`, async () => {
    const s = scenario({ [condition]: true });
    await s.run();
    assert.equal(s.sent.length, 0);
    assert.equal(s.saved.size, 0);
  });
}
