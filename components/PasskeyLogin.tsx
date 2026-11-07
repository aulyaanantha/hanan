'use client';

import { useRef, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startPasskeyLogin, finishPasskeyLogin } from '@/app/login/passkey-actions';
import { supportsPasskeys, requestOptions, serializeCredential, passkeyError } from '@/lib/passkeys';

export default function PasskeyLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const running = useRef(false);
  async function login() {
    if (running.current) return;
    if (!supportsPasskeys()) { setMessage('Browser ini belum mendukung passkey. Gunakan email/password atau browser terbaru melalui HTTPS.'); return; }
    running.current = true; setBusy(true); setMessage('');
    try {
      const start = await startPasskeyLogin();
      if (!start.data) { setMessage(start.error ?? 'Passkey belum tersedia.'); return; }
      const credential = await navigator.credentials.get({ publicKey: requestOptions(start.data.options) });
      if (!(credential instanceof PublicKeyCredential)) { setMessage('Tidak ada passkey yang dipilih.'); return; }
      const result = await finishPasskeyLogin({ challengeId: start.data.challenge_id, credential: serializeCredential(credential) });
      if (result.error) { setMessage(result.error); return; }
      router.replace('/');
      router.refresh();
    } catch (error) { setMessage(passkeyError(error)); }
    finally { running.current = false; setBusy(false); }
  }
  return <div className="mt-5">
    <div className="mb-4 text-center text-xs text-[var(--muted)]">or enter sooner</div>
    <button type="button" onClick={login} disabled={busy} aria-busy={busy}
      className="block mx-auto soft-card-inset flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold text-[var(--primary)] disabled:opacity-60">
      <Fingerprint size={20} aria-hidden="true" />
    </button>
    <p className="mt-2 text-center text-[10px] leading-4 text-[var(--muted)]">Enable it first in Settings after logging in. Use your fingerprint, face, or device PIN.</p>
    {message && <p role="status" className="mt-3 text-center text-xs text-[var(--primary)]">{message}</p>}
  </div>;
}
