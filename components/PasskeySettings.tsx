'use client';

import { useEffect, useRef, useState } from 'react';
import type { PasskeyListItem } from '@supabase/supabase-js';
import { Fingerprint, Trash2 } from 'lucide-react';
import { listPasskeys, startPasskeyRegistration, finishPasskeyRegistration, deletePasskey } from '@/app/login/passkey-actions';
import { supportsPasskeys, creationOptions, serializeCredential, passkeyError } from '@/lib/passkeys';

export default function PasskeySettings() {
  const [keys, setKeys] = useState<PasskeyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const running = useRef(false);
  useEffect(() => {
    let active = true;
    listPasskeys().then(result => {
      if (!active) return;
      if (result.error) setMessage(result.error);
      else setKeys(result.data ?? []);
    }).catch(() => { if (active) setMessage('Daftar passkey gagal dimuat. Coba muat ulang halaman.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function run(operation: () => Promise<void>) {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try { await operation(); }
    catch (error) { setMessage(passkeyError(error)); }
    finally { running.current = false; setBusy(false); }
  }
  async function refresh(success: string) {
    const result = await listPasskeys();
    if (result.error) { setMessage(`${success} Daftar belum dapat diperbarui; muat ulang halaman.`); return; }
    setKeys(result.data ?? []); setMessage(success);
  }
  async function register() {
    if (!supportsPasskeys()) { setMessage('Browser ini belum mendukung passkey. Buka melalui HTTPS di browser terbaru.'); return; }
    await run(async () => {
      let stage = 'meminta data pendaftaran';
      try {
        const start = await startPasskeyRegistration();
        if (!start.data) { setMessage(start.error ?? 'Passkey belum tersedia.'); return; }
        stage = 'membuka verifikasi perangkat';
        const credential = await navigator.credentials.create({ publicKey: creationOptions(start.data.options) });
        if (!(credential instanceof PublicKeyCredential)) { setMessage('Pendaftaran passkey dibatalkan.'); return; }
        stage = 'menyimpan passkey';
        const result = await finishPasskeyRegistration({ challengeId: start.data.challenge_id, credential: serializeCredential(credential) });
        if (result.error) { setMessage(result.error); return; }
        stage = 'memperbarui daftar passkey';
        await refresh('Passkey berhasil ditambahkan. Kamu bisa memakainya pada login berikutnya.');
      } catch (error) {
        // Only expose an error class, never credential contents or session data.
        const name = error instanceof Error && /^[A-Za-z]+$/.test(error.name) ? error.name : 'UnknownError';
        console.error('Passkey registration failed', { stage, name });
        setMessage(`${passkeyError(error)} Tahap: ${stage} (${name}).`);
      }
    });
  }
  async function remove(key: PasskeyListItem) {
    if (!window.confirm('Hapus passkey ini dari akun HANAN? Kamu tetap bisa masuk dengan email/password.')) return;
    await run(async () => {
      const result = await deletePasskey(key.id);
      if (result.error) { setMessage(result.error); return; }
      await refresh('Passkey berhasil dihapus dari akun HANAN.');
    });
  }
  return <section className="theme-panel mt-5 rounded-3xl p-5 sm:p-7" aria-labelledby="passkey-heading">
    <div className="flex items-start gap-3">
      <Fingerprint className="mt-1 shrink-0 text-[var(--primary)]" size={26} aria-hidden="true" />
      <div><h2 id="passkey-heading" className="text-lg font-semibold">Log in with a passkey</h2>
      </div>
    </div>
    {loading ? <p role="status" className="mt-4 text-sm text-[var(--muted)]">Loading passkey…</p> : <>
      {keys.length > 0 && <ul className="mt-4 space-y-3">{keys.map(key => <li key={key.id} className="soft-card-inset flex items-center justify-between gap-3 rounded-2xl p-4">
        <div className="min-w-0"><p className="break-words text-sm font-semibold">{key.friendly_name || 'Passkey HANAN'}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Added {new Date(key.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}</p></div>
        <button type="button" disabled={busy} onClick={() => remove(key)} aria-label={`Hapus ${key.friendly_name || 'passkey HANAN'}`}
          className="rounded-xl p-3 text-[var(--primary)] disabled:opacity-60"><Trash2 size={18} /></button>
      </li>)}</ul>}
      {!message && keys.length === 0 && <p className="mt-4 text-sm text-[var(--muted)]">No passkeys registered yet.</p>}
    </>}
    <button type="button" disabled={busy || loading} onClick={register} aria-busy={busy}
      className="soft-card-inset mt-4 rounded-2xl px-5 py-3 text-sm font-semibold text-[var(--primary)] disabled:opacity-60">
      {busy ? 'Processing…' : 'Add a passkey'}
    </button>
    <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Use your own device or passkey manager. Fingerprint data is not sent to HANAN.</p>
    {message && <p role="status" className="mt-3 text-sm text-[var(--primary)]">{message}</p>}
  </section>;
}
