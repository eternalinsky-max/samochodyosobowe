'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

export default function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const next = pathname + (searchParams.toString() ? `?${searchParams}` : '');
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      } else {
        setAuthed(true);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router, pathname, searchParams]);

  if (loading) {
    return (
      <div
        role="status"
        className="mx-auto max-w-xl rounded-xl border bg-white p-6 text-center text-gray-600"
      >
        Ładowanie…
      </div>
    );
  }

  if (!authed) {
    // редірект вже запущено, але для безпеки можна показати fallback
    return (
      <div className="mx-auto max-w-xl rounded-xl border bg-white p-6 text-center text-gray-600">
        Proszę się zalogować…
      </div>
    );
  }

  return children;
}
