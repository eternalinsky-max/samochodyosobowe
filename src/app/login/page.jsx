'use client';

import { onAuthStateChanged,signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth,loginWithGoogle } from '@/lib/firebase';

export default function LoginPage() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        localStorage.removeItem('idToken');
        setMe(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        localStorage.setItem('idToken', token);
        const r = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setMe(data);
        setErr(null);
      } catch (e) {
        setErr(e.message);
      }
    });
    return () => unsub();
  }, []);

  async function handleGoogle() {
    try {
      setErr(null);
      setLoadingGoogle(true);
      await loginWithGoogle();
    } catch (e) {
      setErr(e.message || 'Logowanie przez Google nie powiodło się');
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Zaloguj się</h1>

      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-soft">
        <button
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="btn btn-primary w-full justify-center"
        >
          {loadingGoogle ? 'Logowanie…' : 'Zaloguj przez Google'}
        </button>

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>

      {me && (
        <div className="rounded-xl border bg-white p-6 shadow-soft">
          <div>
            <b>Zalogowano jako:</b> {me.displayName || me.email || 'Użytkownik'}
          </div>
          <button onClick={() => signOut(auth)} className="btn btn-ghost mt-3">
            Wyloguj
          </button>
        </div>
      )}
    </section>
  );
}
