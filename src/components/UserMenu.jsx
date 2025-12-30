// src/components/UserMenu.jsx
'use client';
/* eslint-env browser */

import { signOut } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { auth } from '@/lib/firebase';
import { useAuthUser } from '@/lib/useAuthUser';

export default function UserMenu({ mobile = false, onAction }) {
  const { user, loading } = useAuthUser();
  return mobile ? (
    <UserMenuMobile user={user} loading={loading} onAction={onAction} />
  ) : (
    <UserMenuDesktop user={user} loading={loading} onAction={onAction} />
  );
}

/* ---------- утил: локальний аватар з ініціалами ---------- */
function InitialsAvatar({ name = 'U' }) {
  const initials =
    (name || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <div
      aria-hidden="true"
      className="grid size-8 place-items-center rounded-full text-xs font-semibold"
      style={{ background: '#E5EEF9', color: '#1D4ED8' }}
    >
      {initials}
    </div>
  );
}

/* =================== DESKTOP =================== */
function UserMenuDesktop({ user, loading, onAction }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const boxRef = useRef(null);
  const firstItemRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  function onMenuKeyDown(e) {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const items = Array.from(boxRef.current?.querySelectorAll('[role="menuitem"]') || []);
    const idx = items.findIndex((el) => el === document.activeElement);
    if (idx === -1) {
      items[0]?.focus();
      return;
    }
    const next =
      e.key === 'ArrowDown'
        ? items[(idx + 1) % items.length]
        : items[(idx - 1 + items.length) % items.length];
    next?.focus();
  }

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" aria-busy="true" />;
  }

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary">
        Zaloguj się
      </Link>
    );
  }

  const display = user.displayName || user.email || 'U';

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border px-2 py-1.5 hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu użytkownika"
        aria-controls="user-menu-dropdown"
      >
        {user.photoURL && typeof user.photoURL === 'string' ? (
          <Image
            src={user.photoURL}
            alt={`Avatar ${display}`}
            width={32}
            height={32}
            sizes="32px"
            className="rounded-full"
          />
        ) : (
          <InitialsAvatar name={display} />
        )}
        <span className="hidden max-w-40 truncate text-sm sm:block">{display}</span>
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      <div
        id="user-menu-dropdown"
        role="menu"
        tabIndex={-1}
        onKeyDown={onMenuKeyDown}
        className={`absolute right-0 mt-2 w-56 rounded-2xl border bg-white p-2 shadow-soft transition ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <Link
          href="/profile"
          role="menuitem"
          ref={firstItemRef}
          className="block rounded-lg px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          onClick={() => {
            setOpen(false);
            onAction?.();
          }}
        >
          Mój profil
        </Link>
        <Link
          href="/my-jobs"
          role="menuitem"
          className="block rounded-lg px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          onClick={() => {
            setOpen(false);
            onAction?.();
          }}
        >
          Moje oferty
        </Link>
        <div className="my-1 border-t" />
        <button
          type="button"
          role="menuitem"
          disabled={signingOut}
          className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:opacity-60"
          onClick={async () => {
            try {
              setSigningOut(true);
              await signOut(auth);
            } catch (err) {
              console.error('signOut error:', err);
            } finally {
              setSigningOut(false);
              setOpen(false);
              onAction?.();
            }
          }}
        >
          {signingOut ? 'Wylogowywanie…' : 'Wyloguj'}
        </button>
      </div>
    </div>
  );
}

/* =================== MOBILE =================== */
function UserMenuMobile({ user, loading, onAction }) {
  if (loading) {
    return <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" aria-busy="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={() => onAction?.()}
        className="btn btn-primary w-full text-center"
      >
        Zaloguj się
      </Link>
    );
  }

  const display = user.displayName || user.email || 'U';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 px-3 py-2">
        {user.photoURL && typeof user.photoURL === 'string' ? (
          <Image
            src={user.photoURL}
            alt={`Avatar ${display}`}
            width={32}
            height={32}
            sizes="32px"
            className="rounded-full"
          />
        ) : (
          <InitialsAvatar name={display} />
        )}
        <div className="text-sm">
          <div className="font-medium">{display}</div>
          <div className="text-gray-500">Zalogowano</div>
        </div>
      </div>

      <Link
        href="/profile"
        onClick={() => onAction?.()}
        className="rounded-lg px-3 py-2 hover:bg-gray-50"
      >
        Mój profil
      </Link>
      <Link
        href="/my-jobs"
        onClick={() => onAction?.()}
        className="rounded-lg px-3 py-2 hover:bg-gray-50"
      >
        Moje oferty
      </Link>
      <button
        type="button"
        onClick={async () => {
          try {
            await signOut(auth);
          } catch (e) {
            console.error(e);
          } finally {
            onAction?.();
          }
        }}
        className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
      >
        Wyloguj
      </button>
    </div>
  );
}
