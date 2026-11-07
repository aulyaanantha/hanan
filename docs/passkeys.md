# Passkey HANAN

Email/password remains available. Passkeys use Supabase Auth and the existing
HANAN membership check; no application database migration is required. The SDK
feature is experimental. Tokens stay in the existing HTTP-only server cookies.

## Required Supabase setup

In Authentication → Passkeys, enable passkey authentication:

- Relying Party Display Name: `HANAN`
- Relying Party ID: the stable production hostname, without https, port, or path.
- Relying Party Origins: the exact HTTPS origin where HANAN is served.

Use the actual deployed domain, not a temporary preview hostname. Changing RP ID
invalidates existing passkeys. Local development requires a separate Supabase
project configured with RP ID `localhost` and origin `http://localhost:3000`.
Do not replace production RP settings just to test locally.

Reference: https://supabase.com/docs/guides/auth/passkeys

## User flow and manual verification

1. Log in with each member's email/password, open Settings, add a passkey.
2. Cancel enrollment: no success message and no new key should appear.
3. Log out, choose “Masuk dengan passkey”, complete device verification.
4. Verify the account is the correct member, including Personal Savings access.
5. Cancel login, then verify email/password still works.
6. Delete a passkey in Settings, log out, verify that credential no longer logs in.
7. Verify unsupported browsers or disabled Supabase passkeys show a recoverable
   message while password login remains usable.

Device authentication may use fingerprint, face, PIN, a password manager, or a
security key. HANAN cannot require a particular biometric. Physical biometric
testing and production RP configuration must be verified on the target device.

Enrollment now selects a platform authenticator and requires a discoverable
credential with user verification. Login uses the `client-device` WebAuthn hint
and requires user verification. Browsers may ignore hints; account/provider
selection and biometric versus device PIN remain controlled by the OS/browser.
Existing passkeys are retained. If an old credential was created on an external
authenticator, add a new passkey from the intended phone before removing it.
