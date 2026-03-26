'use client';

import { loginWithGoogle } from '@/lib/login-with-google';

export default function SignInButton() {

  async function handleGoogle() {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      alert("Google login error");
    }
  }

  function handleApple() {
    alert("Logowanie przez Apple będzie dostępne wkrótce 🍏");
  }

  return (
    <div className="flex flex-col gap-3">

      {/* GOOGLE */}
      <button
        onClick={handleGoogle}
        className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white 
        backdrop-blur transition hover:bg-white/10 active:scale-[0.99]"
      >
        <img src="/icons/google.svg" className="h-5 w-5 shrink-0" />
        <span>Zaloguj się przez Google</span>
      </button>

      {/* DIVIDER */}
      <div className="flex items-center gap-3 text-xs text-slate-500 my-1">
        <div className="h-px flex-1 bg-white/10" />
        lub
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* APPLE (PLACEHOLDER) */}
      <button
        onClick={handleApple}
        className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white 
        backdrop-blur opacity-70 cursor-not-allowed"
      >
        <img src="/icons/apple.svg" className="h-5 w-5 shrink-0" />
        <span>Zaloguj się przez Apple</span>
      </button>

      {/* INFO */}
      <div className="text-xs text-center text-slate-500">
        Apple login będzie dostępny wkrótce
      </div>

    </div>
  );
}