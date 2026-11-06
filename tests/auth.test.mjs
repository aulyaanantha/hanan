import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, mocks) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`);
      return mocks[name];
    },
    console,
  }, { filename: file });
  return exports;
}

function authClient({ user = null, authError = null, member = null, memberError = null } = {}) {
  return {
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from(table) {
      assert.equal(table, 'hanan_members');
      return { select: () => ({ eq: (column, id) => {
        assert.equal(column, 'user_id');
        assert.equal(id, user.id);
        return { maybeSingle: async () => ({ data: member, error: memberError }) };
      } }) };
    },
  };
}

for (const [name, options, allowed] of [
  ['legacy cookie without a valid Supabase user', {}, false],
  ['forged/invalid token', { user: { id: '123' }, authError: {} }, false],
  ['Farhan', { user: { id: 'f' }, member: { display_name: 'Farhan' } }, true],
  ['Anantha', { user: { id: 'a' }, member: { display_name: 'Anantha' } }, true],
  ['valid account without membership', { user: { id: 'x' } }, false],
  ['membership query failure', { user: { id: 'x' }, memberError: {} }, false],
  ['unexpected member name', { user: { id: 'x' }, member: { display_name: 'Other' } }, false],
]) {
  test(`authentication: ${name}`, async () => {
    const session = load('lib/session/server.ts', {
      'server-only': {}, react: { cache: fn => fn },
      '@/lib/supabase/auth': { createSupabaseAuthClient: async () => authClient(options) },
    });
    assert.equal(await session.isAuthenticated(), allowed);
  });
}

for (const [file, methods] of [
  ['app/api/settings/target/route.ts', ['POST']],
  ['app/api/seabank/route.ts', ['GET', 'POST']],
]) {
  for (const method of methods) {
    test(`${method} ${file} denies access before reading data or body`, async () => {
      const routes = load(file, {
        'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
        '@/lib/session/server': { isAuthenticated: async () => false },
        '@/lib/supabase/server': { createSupabaseServerClient: () => { throw new Error('Database must not be accessed'); } },
      });
      const result = await routes[method]({ json: () => { throw new Error('Body must not be read'); } });
      assert.equal(result.status, 401);
    });
  }
}

function actions(client) {
  return load('app/login/actions.ts', {
    'next/navigation': { redirect: path => { throw new Error(`redirect:${path}`); } },
    'next/headers': { cookies: async () => ({ delete: () => {} }) },
    'next/cache': { revalidatePath: () => {} },
    '@/lib/supabase/auth': { createSupabaseAuthClient: async () => client },
  });
}
function form(email, password) { return new Map([['email', email], ['password', password]]); }
test('login rejects empty credentials', async () => {
  assert.equal((await actions(null).loginAction({}, form('', ''))).error, 'empty');
});
test('login rejects an incorrect password', async () => {
  const client = { auth: { signInWithPassword: async () => ({ data: {}, error: {} }) } };
  const result = await actions(client).loginAction({}, form('test@example.com', 'wrong'));
  assert.equal(result.error, 'invalid');
  assert.equal(JSON.stringify(result), '{"error":"invalid"}');
});
for (const name of ['Farhan', 'Anantha', null]) {
  test(`login membership: ${name ?? 'non-member'}`, async () => {
    let signedOut = false;
    const client = authClient({ user: { id: 'id' }, member: name ? { display_name: name } : null });
    client.auth.signInWithPassword = async () => ({ data: { user: { id: 'id' } }, error: null });
    client.auth.signOut = async () => { signedOut = true; return { error: null }; };
    if (name) {
      await assert.rejects(actions(client).loginAction({}, form('test@example.com', 'password')), /^Error: redirect:\/$/);
    } else {
      assert.equal((await actions(client).loginAction({}, form('test@example.com', 'password'))).error, 'access');
    }
    assert.equal(signedOut, !name);
  });
}
test('logout revokes the local Supabase session', async () => {
  let signedOut = false;
  const client = { auth: { signOut: async ({ scope }) => { assert.equal(scope, 'local'); signedOut = true; } } };
  await assert.rejects(actions(client).logoutAction(), /redirect:\/login$/);
  assert.equal(signedOut, true);
});
for (const method of ['POST', 'PATCH', 'DELETE']) {
  for (const [name, member, expected] of [
    ['anonymous', null, 401],
    ['Farhan', { userId: 'f', displayName: 'Farhan' }, 403],
    ['Anantha', { userId: 'a', displayName: 'Anantha' }, 400],
  ]) {
    test(`Personal Savings ${method}: ${name}`, async () => {
      const route = load('app/api/personal-savings/route.ts', {
        'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
        '@/lib/session/server': { getAuthenticatedMember: async () => member },
        '@/lib/supabase/server': { createSupabaseServerClient: () => { throw new Error('Database must not be accessed'); } },
      });
      let bodyRead = false;
      const response = await route[method]({ json: async () => { bodyRead = true; return {}; } });
      assert.equal(response.status, expected);
      assert.equal(bodyRead, name === 'Anantha');
    });
  }
}
for (const name of ['Farhan', 'Anantha']) {
  test(`new income belongs to signed-in ${name}, ignoring forged person`, async () => {
    let saved;
    let recipient;
    const route = load('app/api/payments/route.ts', {
      'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
      '@/lib/session/server': { getAuthenticatedMember: async () => ({ userId: 'id', displayName: name }) },
      '@/lib/supabase/server': { createSupabaseServerClient: () => ({ from(table) {
        if (table === 'weeks') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'w', week_number: 1 } }) }) }) };
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
          insert: async data => { saved = data; return { error: null }; },
        };
      } }) },
      '@/lib/notifications/send': { sendNotificationToPerson: async person => { recipient = person; } },
      '@/lib/notifications/target': { checkAndSendTargetNotification: async () => {} },
    });
    const other = name === 'Farhan' ? 'Anantha' : 'Farhan';
    const result = await route.POST({ json: async () => ({ person: other, weekId: 'w', amount: 25000, paymentDate: '2026-11-03' }) });
    assert.equal(result.body.success, true);
    assert.equal(saved.person, name);
    assert.equal(recipient, other);
  });
}
