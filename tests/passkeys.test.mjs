import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ member = 'Anantha', authorized = true, verifyError = false, memberError = false } = {}) {
  const calls = [];
  const client = {
    auth: {
      passkey: {
        startRegistration: async () => { calls.push('register'); return { data: { challenge_id: 'challenge' } }; },
        verifyRegistration: async () => { calls.push('verifyRegistration'); return {}; },
        list: async () => { calls.push('list'); return { data: [] }; },
        delete: async params => { calls.push(params); return {}; },
        verifyAuthentication: async () => ({ error: verifyError ? {} : null, data: verifyError ? null : { user: { id: 'user' }, session: {} } }),
      },
      signOut: async options => { calls.push(['signOut', options.scope]); },
    },
    from: () => ({ select: () => ({ eq: (_field, id) => {
      assert.equal(id, 'user');
      return { maybeSingle: async () => ({ data: member ? { display_name: member } : null, error: memberError ? {} : null }) };
    } }) }),
  };
  const exports = {};
  const mocks = {
    'next/cache': { revalidatePath: () => calls.push('revalidate') },
    '@/lib/supabase/auth': { createSupabaseAuthClient: async () => client },
    '@/lib/session/server': { getAuthenticatedMember: async () => authorized ? { userId: 'user', displayName: member } : null },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/login/passkey-actions.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: name => { assert.ok(name in mocks); return mocks[name]; } });
  return { actions: exports, calls };
}

for (const member of ['Farhan', 'Anantha']) test(`passkey login admits ${member} after membership verification`, async () => {
  const s = setup({ member });
  assert.equal((await s.actions.finishPasskeyLogin({})).success, true);
  assert.ok(s.calls.includes('revalidate'));
});
for (const options of [{ member: null }, { member: 'Other' }, { memberError: true }]) test(`passkey rejects non-members or failed membership lookup ${JSON.stringify(options)}`, async () => {
  const s = setup(options);
  assert.ok((await s.actions.finishPasskeyLogin({})).error);
  assert.equal(s.calls[0][0], 'signOut');
  assert.equal(s.calls.includes('revalidate'), false);
});
test('invalid credential never grants access', async () => {
  const s = setup({ verifyError: true });
  assert.ok((await s.actions.finishPasskeyLogin({})).error);
  assert.equal(s.calls.length, 0);
});
test('all passkey management requires an authenticated HANAN member', async () => {
  const s = setup({ authorized: false });
  for (const method of ['startPasskeyRegistration', 'finishPasskeyRegistration', 'listPasskeys', 'deletePasskey']) {
    assert.ok((await s.actions[method]({})).error);
  }
  assert.equal(s.calls.length, 0);
});
test('delete passes only the selected ID to the user-scoped API', async () => {
  const s = setup();
  assert.ok((await s.actions.deletePasskey('bad')).error);
  assert.equal(s.calls.length, 0);
  const id = '12345678-1234-1234-1234-123456789012';
  assert.equal((await s.actions.deletePasskey(id)).success, true);
  assert.equal(s.calls[0].passkeyId, id);
});
