'use client';

import { loginWithGoogle } from '@/lib/login-with-google';

export default function SignInButton() {
  return (
    <button
      onClick={loginWithGoogle}
      className="btn rounded-lg bg-red-500 px-4 py-2 text-white transition-transform hover:scale-[1.03] hover:bg-red-600"
    >
      Zaloguj się przez Google
    </button>
  );
}
