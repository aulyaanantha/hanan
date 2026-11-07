import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(hostname = 'localhost') {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/passkeys.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, window: { location: { hostname } }, atob, btoa, Error });
  return exports;
}
const options = { rp: { id: 'localhost', name: 'HANAN' }, user: { id: 'AQID', name: 'member', displayName: 'Member' }, challenge: '-_8', pubKeyCredParams: [{ type: 'public-key', alg: -7 }] };

test('registration decodes base64url binary fields without changing RP configuration', () => {
  const result = load().creationOptions(options);
  assert.equal(Buffer.from(result.challenge).toString('hex'), 'fbff');
  assert.equal(Buffer.from(result.user.id).toString('hex'), '010203');
  assert.equal(result.rp.id, 'localhost');
});
test('enrollment selects a discoverable credential on the current device', () => {
  const result = load().creationOptions({ ...options, authenticatorSelection: { authenticatorAttachment: 'cross-platform', userVerification: 'discouraged' } });
  assert.equal(result.authenticatorSelection.authenticatorAttachment, 'platform');
  assert.equal(result.authenticatorSelection.residentKey, 'required');
  assert.equal(result.authenticatorSelection.requireResidentKey, true);
  assert.equal(result.authenticatorSelection.userVerification, 'required');
  assert.equal(result.hints[0], 'client-device');
});
test('login prefers the current device without discarding server credential restrictions', () => {
  const result = load().requestOptions({ challenge: '-_8', rpId: 'localhost', timeout: 60000,
    allowCredentials: [{ type: 'public-key', id: 'AQID', transports: ['internal'] }] });
  assert.equal(result.hints[0], 'client-device');
  assert.equal(result.userVerification, 'required');
  assert.equal(result.rpId, 'localhost');
  assert.equal(result.timeout, 60000);
  assert.equal(Buffer.from(result.allowCredentials[0].id).toString('hex'), '010203');
  assert.equal(result.allowCredentials[0].transports[0], 'internal');
});
test('domain mismatch is detected before opening the device dialog', () => {
  assert.throws(() => load('hanan.example.com').creationOptions(options), /PasskeyDomainMismatch/);
});
test('subdomain registration is allowed for the configured RP', () => {
  const result = load('app.example.com').creationOptions({ ...options, rp: { id: 'example.com', name: 'HANAN' } });
  assert.equal(result.rp.id, 'example.com');
});
test('invalid options produce an actionable diagnostic', () => {
  assert.throws(() => load().creationOptions(undefined), /InvalidPasskeyOptions/);
});
test('security errors explain domain setup while cancellation remains retryable', () => {
  const security = new Error(); security.name = 'SecurityError';
  assert.match(load().passkeyError(security), /Relying Party ID/);
  const cancelled = new Error(); cancelled.name = 'NotAllowedError';
  assert.match(load().passkeyError(cancelled), /dibatalkan/);
});
