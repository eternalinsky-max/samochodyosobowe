'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { useAuthUser } from '@/lib/useAuthUser';

/**
 * withAuth(Component, { loadingFallback?, onUnauthorized? })
 * - loadingFallback: JSX під час перевірки (за замовч. простий блок)
 * - onUnauthorized: (router, nextUrl) => void — кастомна дія, якщо неавторизований
 */
export function withAuth(Wrapped, opts = {}) {
  const { loadingFallback, onUnauthorized } = opts;

  function AuthWrapper(props) {
    const { user, loading } = useAuthUser();
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const nextUrl = pathname + (sp.toString() ? `?${sp}` : '');

    if (loading) {
      return (
        loadingFallback ?? (
          <div
            role="status"
            className="mx-auto max-w-xl rounded-xl border bg-white p-6 text-center text-gray-600"
          >
            Ładowanie…
          </div>
        )
      );
    }

    if (!user) {
      if (onUnauthorized) {
        onUnauthorized(router, nextUrl);
      } else {
        router.replace(`/login?next=${encodeURIComponent(nextUrl)}`);
      }
      return (
        <div className="mx-auto max-w-xl rounded-xl border bg-white p-6 text-center text-gray-600">
          Proszę się zalogować…
        </div>
      );
    }

    return <Wrapped {...props} user={user} />;
  }

  // зберігаємо ім'я для DevTools
  AuthWrapper.displayName = `withAuth(${Wrapped.displayName || Wrapped.name || 'Component'})`;
  return AuthWrapper;
}
