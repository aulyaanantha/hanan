'use client';
import { useFormStatus } from 'react-dom';
export default function LoginButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="mt-5 w-full rounded-2xl bg-[var(--primary)] px-5 py-4 text-sm font-bold text-white transition hover:bg-[var(--primary-dark)] disabled:opacity-60">{pending ? 'Signing in...' : 'Login'}</button>;
}
