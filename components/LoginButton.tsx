'use client';
import { useFormStatus } from 'react-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';
export default function LoginButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending} className="login-submit mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-4 text-sm font-bold text-white transition hover:bg-[var(--primary-dark)] disabled:opacity-60"><span>{pending ? 'Signing in...' : 'Login'}</span>{pending ? <LoaderCircle size={17} className="login-submit-spinner" aria-hidden="true" /> : <ArrowRight size={17} className="login-submit-arrow" aria-hidden="true" />}</button>;
}
