"use client";

import SignInButton from "@/components/SignInButton";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">

        <h1 className="text-2xl font-semibold text-white text-center">
          Zaloguj się
        </h1>

        <p className="mt-2 text-sm text-slate-400 text-center">
          Wybierz sposób logowania
        </p>

        <div className="mt-6 space-y-4">
          <SignInButton />
        </div>

        <div className="mt-6 text-xs text-slate-500 text-center">
          Logując się akceptujesz regulamin i politykę prywatności
        </div>

      </div>

    </main>
  );
}

