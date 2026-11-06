"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";
import LoginButton from "./LoginButton";
import LoginMascot from "./LoginMascot";

const messages = {
  empty: "Enter your email and password.",
  invalid: "Email or password is incorrect. Please try again.",
  access: "Akun ini belum terdaftar sebagai anggota HANAN.",
};

export default function LoginForm({ initialError }: { initialError?: string }) {
  const initialState: LoginState = {
    error: initialError === "empty" || initialError === "invalid" || initialError === "access" ? initialError : undefined,
  };
  const [state, action] = useActionState(loginAction, initialState);
  // Keep credentials only in the mounted form, including after a rejected submission.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const message = state.error ? messages[state.error] : undefined;

  return <form action={action} className="login-form mt-8">
    <div>
      <label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)]">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required maxLength={254}
        placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)}
        aria-describedby={message ? "login-error" : undefined}
        className="login-field mt-2 mb-5 w-full rounded-2xl bg-[var(--surface-raised)] px-4 py-4 text-[var(--foreground)] outline-none" />
      <label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)]">Password</label>
      <div className="login-field login-password-field mt-2 rounded-2xl bg-[var(--surface-raised)] px-4 shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)]">
        <LoginMascot />
        <input id="password" name="password" type="password" inputMode="numeric" required autoComplete="current-password"
          placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)}
          aria-describedby={message ? "login-error" : undefined}
          className="w-full bg-transparent py-4 text-base text-[var(--foreground)] outline-none placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-[var(--muted)]" />
      </div>
    </div>
    {message && <div id="login-error" role="alert" className="mt-3 rounded-xl bg-[var(--surface-raised)] px-4 py-3 text-center">
      <p className="text-xs font-semibold text-[var(--primary)]">{message}</p>
    </div>}
    <LoginButton />
  </form>;
}
