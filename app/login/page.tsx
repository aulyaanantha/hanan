import LoginButton from "@/components/LoginButton";
import { isAuthenticated } from "@/lib/session/server";
import { redirect } from "next/navigation";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) redirect("/");
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-5 py-10">
      <div className="w-full max-w-[420px]">
        {/* LOGIN CARD */}

        <div className="rounded-[32px] bg-[var(--surface)] p-7 shadow-[12px_12px_30px_var(--shadow-dark),-12px_-12px_30px_var(--shadow-light)] sm:p-9">
          {/* BRAND */}

          <div className="text-center">
            <div className="mx-auto flex h-25 w-25 items-center justify-center rounded-full bg-[var(--surface)] p-1.5 shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)]">
              <img
                src="/images/hanan.jpg"
                alt="HANAN"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              Welcome To Our Little Space ♥
            </h1>

            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[var(--muted)]">
              Sign in with your email and password to continue our savings journey.
            </p>
          </div>

          {/* FORM */}

          <form action={loginAction} className="mt-8">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)]">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} placeholder="you@example.com" className="mt-2 mb-5 w-full rounded-2xl bg-[var(--surface-raised)] px-4 py-4 text-[var(--foreground)] outline-none" />
              <label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)]">Password</label>
              <div className="mt-2 rounded-2xl bg-[var(--surface-raised)] px-4 shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)]">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent py-4 text-base text-[var(--foreground)] outline-none placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            {/* ERROR */}

            {params.error === "invalid" && (
              <div role="alert" className="mt-3 rounded-xl bg-[var(--surface-raised)] px-4 py-3 text-center">
                <p className="text-xs font-semibold text-[var(--primary)]">
                  Email atau password salah. Silakan coba lagi.
                </p>
              </div>
            )}

            {params.error === "empty" && (
              <div role="alert" className="mt-3 rounded-xl bg-[var(--surface-raised)] px-4 py-3 text-center">
                <p className="text-xs font-semibold text-[var(--primary)]">
                  Masukkan email dan password kamu.
                </p>
              </div>
            )}

            {/* BUTTON */}

            {params.error === "access" && <p role="alert" className="mt-3 text-sm text-[var(--primary)]">Akun ini belum terdaftar sebagai anggota HANAN.</p>}
            <LoginButton />
          </form>

          {/* FOOTER */}

          <div className="mt-7 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Private savings space
            </p>
          </div>
        </div>

        {/* SMALL BRAND TEXT */}

        <p className="mt-6 text-center text-xs font-medium text-[var(--muted)]">
          © 2026 · Made by Anantha
        </p>
      </div>
    </main>
  );
}
