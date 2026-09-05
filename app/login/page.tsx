import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e9eef5] px-5 py-10">
      <div className="w-full max-w-[420px]">
        {/* LOGIN CARD */}

        <div className="rounded-[32px] bg-[#e9eef5] p-7 shadow-[12px_12px_30px_rgba(174,184,196,0.35),-12px_-12px_30px_rgba(255,255,255,0.9)] sm:p-9">
          {/* BRAND */}

          <div className="text-center">
            <div className="mx-auto flex h-25 w-25 items-center justify-center rounded-full bg-[#e9eef5] p-1.5 shadow-[6px_6px_14px_rgba(174,184,196,0.35),-6px_-6px_14px_rgba(255,255,255,0.9)]">
              <img
                src="/images/hanan.jpg"
                alt="HANAN"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-700 sm:text-2xl">
              Welcome To Our Little Space ♥
            </h1>

            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-slate-400">
              Enter our PIN to continue our savings journey.
            </p>
          </div>

          {/* FORM */}

          <form action={loginAction} className="mt-8">
            <div>
              <div className="mt-2 rounded-2xl bg-[#e9eef5] px-4 shadow-[inset_3px_3px_7px_rgba(174,184,196,0.25),inset_-3px_-3px_7px_rgba(255,255,255,0.85)]">
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Enter here"
                  className="w-full bg-transparent py-4 text-center text-lg font-bold tracking-[0.3em] text-slate-700 outline-none placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* ERROR */}

            {params.error === "invalid" && (
              <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-rose-400">
                  OMG, did you forget our PIN?? Ask your partner!
                </p>
              </div>
            )}

            {params.error === "empty" && (
              <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-rose-400">
                  Please enter your PIN.
                </p>
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-indigo-400 px-5 py-4 text-sm font-bold text-white shadow-[5px_5px_12px_rgba(129,140,248,0.3),-3px_-3px_10px_rgba(255,255,255,0.8)] transition hover:bg-indigo-500 active:scale-[0.99]"
            >
              Login
            </button>
          </form>

          {/* FOOTER */}

          <div className="mt-7 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Private savings space
            </p>
          </div>
        </div>

        {/* SMALL BRAND TEXT */}

        <p className="mt-6 text-center text-xs font-medium text-slate-400">
          © 2026 · Made by Anantha
        </p>
      </div>
    </main>
  );
}
