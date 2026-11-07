import type { PasskeyAuthenticationOptionsResponse, PasskeyRegistrationOptionsResponse, VerifyPasskeyAuthenticationParams } from '@supabase/supabase-js';

export function supportsPasskeys() {
  return typeof window !== 'undefined' && window.isSecureContext &&
    typeof PublicKeyCredential !== 'undefined' && !!navigator.credentials?.create && !!navigator.credentials?.get;
}

function decode(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), c => c.charCodeAt(0)).buffer;
}

function encode(value: ArrayBuffer) {
  return btoa(Array.from(new Uint8Array(value), byte => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function creationOptions(options: PasskeyRegistrationOptionsResponse['options']): PublicKeyCredentialCreationOptions {
  if (!options || typeof options.challenge !== 'string' || typeof options.user?.id !== 'string') {
    throw new Error('InvalidPasskeyOptions');
  }
  const rpId = options.rp?.id;
  const hostname = window.location.hostname;
  if (rpId && hostname !== rpId && !hostname.endsWith(`.${rpId}`)) {
    throw new Error('PasskeyDomainMismatch');
  }
  return { ...options, challenge: decode(options.challenge), user: { ...options.user, id: decode(options.user.id) },
    hints: ['client-device'],
    authenticatorSelection: {
      ...options.authenticatorSelection,
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
    },
    excludeCredentials: options.excludeCredentials?.map(credential => ({ ...credential, id: decode(credential.id) })) } as PublicKeyCredentialCreationOptions;
}

export function requestOptions(options: PasskeyAuthenticationOptionsResponse['options']): PublicKeyCredentialRequestOptions {
  return { ...options, challenge: decode(options.challenge),
    // Prefer this device over security keys or a QR flow on another phone.
    // Browser/OS still controls account selection and biometric vs device PIN.
    hints: ['client-device'],
    userVerification: 'required',
    allowCredentials: options.allowCredentials?.map(credential => ({ ...credential, id: decode(credential.id) })) } as PublicKeyCredentialRequestOptions;
}

export function serializeCredential(credential: PublicKeyCredential): VerifyPasskeyAuthenticationParams['credential'] {
  const response = credential.response;
  const common = { id: credential.id, rawId: encode(credential.rawId), type: 'public-key' as const,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined };
  if ('attestationObject' in response) {
    const attestation = response as AuthenticatorAttestationResponse;
    return { ...common, response: { clientDataJSON: encode(response.clientDataJSON),
      attestationObject: encode(attestation.attestationObject) } } as VerifyPasskeyAuthenticationParams['credential'];
  }
  const assertion = response as AuthenticatorAssertionResponse;
  return { ...common, response: { clientDataJSON: encode(response.clientDataJSON),
    authenticatorData: encode(assertion.authenticatorData), signature: encode(assertion.signature),
    userHandle: assertion.userHandle ? encode(assertion.userHandle) : undefined } } as VerifyPasskeyAuthenticationParams['credential'];
}

export function passkeyError(error: unknown) {
  if (error instanceof Error && (error.name === 'SecurityError' || error.message === 'PasskeyDomainMismatch')) return 'Domain passkey tidak cocok. Alamat HANAN harus sesuai dengan Relying Party ID dan Origins di Supabase. Untuk konfigurasi localhost, buka http://localhost:3000.';
  if (error instanceof Error && error.message === 'InvalidPasskeyOptions') return 'Data pendaftaran passkey dari server tidak valid. Periksa respons dan konfigurasi Supabase.';
  if (error instanceof Error && error.name === 'NotSupportedError') return 'Perangkat atau pengelola passkey ini tidak mendukung pengaturan yang diminta. Coba browser terbaru atau perangkat lain.';
  if (error instanceof Error && ['NotAllowedError', 'AbortError'].includes(error.name)) return 'Verifikasi dibatalkan atau waktunya habis. Kamu bisa mencoba lagi.';
  if (error instanceof Error && error.name === 'InvalidStateError') return 'Passkey ini sudah terdaftar. Gunakan passkey yang ada untuk masuk.';
  return 'Passkey tidak dapat digunakan. Coba lagi atau gunakan email/password.';
}
