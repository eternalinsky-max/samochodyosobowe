// src/components/Header.jsx
'use client';
/* eslint-env browser */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import LogoutButton from '@/components/LogoutButton';
import { useAuthUser } from '@/lib/useAuthUser';

function NavLink({ href, children, onClick }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`nav-link ${active ? 'font-semibold text-brand-600' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile menu
  const [menuOpen, setMenuOpen] = useState(false); // desktop user menu
  const { user, loading } = useAuthUser();

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const avatarUrl =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.displayName || 'U',
    )}&&background=E5EEF9&color=1D4ED8`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Лого */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-brand-600"
          >
            <img
              src="/favicon.svg"
              alt="proponujeprace.pl"
              className="h-8 w-8"
            />
            <span>proponujeprace.pl</span>
          </Link>

          {/* Десктоп навігація */}
          <nav className="hidden gap-6 md:flex" aria-label="Główna nawigacja">
            <NavLink href="/">Strona główna</NavLink>
            <NavLink href="/jobs">Oferty pracy</NavLink>
            <NavLink href="/post-job">Dodaj ofertę</NavLink>
            <NavLink href="/contact">Kontakt</NavLink>
            <NavLink href="/terms">Regulamin</NavLink>
            <NavLink href="/privacy">Polityka prywatności</NavLink>
          </nav>

          {/* Праворуч: гість або користувач */}
          <div className="hidden items-center gap-3 md:flex">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border px-2 py-1.5 hover:bg-gray-50"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-controls="user-menu"
                >
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                    unoptimized
                  />
                  <span className="hidden max-w-40 truncate text-sm sm:block">
                    {user.displayName || user.email}
                  </span>
                  <svg
                    className="size-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                  </svg>
                </button>

                {/* Дропдаун */}
                <div
                  id="user-menu"
                  role="menu"
                  className={`absolute right-0 mt-2 w-56 rounded-2xl border bg-white p-2 shadow-soft transition ${
                    menuOpen
                      ? 'scale-100 opacity-100'
                      : 'pointer-events-none scale-95 opacity-0'
                  }`}
                >
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Mój profil
                  </Link>
                  <Link
                    href="/my-jobs"
                    className="block rounded-lg px-3 py-2 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Moje oferty
                  </Link>
                  <div className="my-1 border-t" />
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Zaloguj się
              </Link>
            )}
          </div>

          {/* Бургер для мобільного */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border p-2 hover:bg-gray-50 md:hidden"
            aria-label="Otwórz menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              className={`size-5 transition ${open ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Оверлей */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity md:hidden ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Zamknij menu"
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(false);
        }}
      />

      {/* Мобільне меню */}
      <nav
        id="mobile-menu"
        aria-label="Menu mobilne"
        className={`fixed inset-x-0 top-16 mx-4 rounded-2xl border bg-white shadow-soft transition-transform duration-200 md:hidden ${
          open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-3 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-1 p-3">
          <NavLink href="/" onClick={() => setOpen(false)}>
            Strona główna
          </NavLink>
          <NavLink href="/jobs" onClick={() => setOpen(false)}>
            Oferty pracy
          </NavLink>
          <NavLink href="/post-job" onClick={() => setOpen(false)}>
            Dodaj ofertę
          </NavLink>
          <NavLink href="/contact" onClick={() => setOpen(false)}>
            Kontakt
          </NavLink>
          <NavLink href="/terms" onClick={() => setOpen(false)}>
            Regulamin
          </NavLink>
          <NavLink href="/privacy" onClick={() => setOpen(false)}>
            Polityka prywatności
          </NavLink>

          <div className="my-2 border-t" />

          {loading ? (
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Mój profil
              </Link>
              <Link
                href="/my-jobs"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Moje oferty
              </Link>
              <LogoutButton className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50" />
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn btn-primary text-center"
            >
              Zaloguj się
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
