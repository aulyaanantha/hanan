import LoginForm from "@/components/LoginForm";
import PasskeyLogin from "@/components/PasskeyLogin";
import { isAuthenticated } from "@/lib/session/server";
import { redirect } from "next/navigation";
import { Heart, Sparkles, LockKeyhole } from "lucide-react";
import LoginGreeting from "@/components/LoginGreeting";
import { getJakartaGreeting } from "@/lib/login-greeting";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) redirect("/");
  const params = await searchParams;

  return (
    <main className="login-scene flex min-h-screen items-center justify-center bg-[var(--surface)] px-5 py-10">
      <div className="login-atmosphere" aria-hidden="true">
        <div className="login-aura login-aura-one" /><div className="login-aura login-aura-two" />
        <div className="login-journey-ring login-journey-ring-one" /><div className="login-journey-ring login-journey-ring-two" />
        <Heart className="login-floating-symbol login-symbol-one" size={24} />
        <Sparkles className="login-floating-symbol login-symbol-two" size={26} />
        <Heart className="login-floating-symbol login-symbol-three" size={16} />
        <Sparkles className="login-floating-symbol login-symbol-four" size={18} />
        <span className="login-light-dot login-dot-one" /><span className="login-light-dot login-dot-two" /><span className="login-light-dot login-dot-three" />
      </div>
      <div className="login-content w-full max-w-[420px]">
        {/* LOGIN CARD */}

        <div className="login-card rounded-[32px] bg-[var(--surface)] p-7 shadow-[12px_12px_30px_var(--shadow-dark),-12px_-12px_30px_var(--shadow-light)] sm:p-9">
          {/* BRAND */}

          <div className="login-brand text-center">
            <div className="login-logo-orbit">
            <div className="login-logo mx-auto flex h-25 w-25 items-center justify-center rounded-full bg-[var(--surface)] p-1.5 shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)]">
              <img
                src="/images/hanan.jpg"
                alt="HANAN"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="login-heart-orbit" aria-hidden="true"><span><Heart size={15} /></span></div>
            <Sparkles className="login-logo-spark" size={16} aria-hidden="true" />
            </div>
            <h1 className="login-welcome mt-2 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              Welcome To Our Little Space ♥
            </h1>

            <LoginGreeting initialGreeting={getJakartaGreeting(new Date())} />
          </div>

          {/* FORM */}

          <LoginForm initialError={params.error} />
          <PasskeyLogin />
        </div>

        {/* SMALL BRAND TEXT */}

        <p className="mt-6 text-center text-xs font-medium text-[var(--muted)]">
          © 2026 · Made by Anantha
        </p>
      </div>
    </main>
  );
}
