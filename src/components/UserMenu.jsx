"use client";
/* eslint-env browser */

import { signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { auth } from "@/lib/firebase";
import { useAuthUser } from "@/lib/useAuthUser";

export default function UserMenu({ mobile = false, onAction }) {
  const { user, loading } = useAuthUser();

  return mobile ? (
    <UserMenuMobile user={user} loading={loading} onAction={onAction} />
  ) : (
    <UserMenuDesktop user={user} loading={loading} onAction={onAction} />
  );
}

/* ---------- local avatar with initials ---------- */
function InitialsAvatar({ name = "U" }) {
  const initials =
    (name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div
      aria-hidden="true"
      className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-slate-100"
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
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  function onMenuKeyDown(e) {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const items = Array.from(boxRef.current?.querySelectorAll('[role="menuitem"]') || []);
    const idx = items.findIndex((el) => el === document.activeElement);
    if (idx === -1) {
      items[0]?.focus();
      return;
    }
    const next =
      e.key === "ArrowDown"
        ? items[(idx + 1) % items.length]
        : items[(idx - 1 + items.length) % items.length];
    next?.focus();
  }

  if (loading) {
    return (
      <div
        className="h-11 w-16 animate-pulse rounded-2xl border border-white/10 bg-white/5"
        aria-busy="true"
      />
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary">
        Zaloguj się
      </Link>
    );
  }

  const display = user.displayName || user.email || "U";

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-100 backdrop-blur-md transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu użytkownika"
        aria-controls="user-menu-dropdown"
      >
        {user.photoURL && typeof user.photoURL === "string" ? (
          <Image
            src={user.photoURL}
            alt={`Avatar ${display}`}
            width={34}
            height={34}
            sizes="34px"
            className="rounded-full border border-white/10 object-cover"
          />
        ) : (
          <InitialsAvatar name={display} />
        )}

        <svg
          className={`size-4 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      <div
        id="user-menu-dropdown"
        role="menu"
        tabIndex={-1}
        onKeyDown={onMenuKeyDown}
        className={`absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-black/75 p-2 text-slate-100 shadow-2xl backdrop-blur-xl transition ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="px-3 py-2 text-xs text-slate-400">{user.email}</div>

        <Link
          href="/profile"
          role="menuitem"
          ref={firstItemRef}
          className="block rounded-xl px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 focus:bg-white/10 focus:outline-none"
          onClick={() => {
            setOpen(false);
            onAction?.();
          }}
        >
          Mój profil
        </Link>

        <Link
          href="/my-cars"
          role="menuitem"
          className="block rounded-xl px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 focus:bg-white/10 focus:outline-none"
          onClick={() => {
            setOpen(false);
            onAction?.();
          }}
        >
          Moje samochody
        </Link>

        <div className="my-2 border-t border-white/10" />

        <button
          type="button"
          role="menuitem"
          disabled={signingOut}
          className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none disabled:opacity-60"
          onClick={async () => {
            try {
              setSigningOut(true);
              await signOut(auth);
            } catch (err) {
              console.error("signOut error:", err);
            } finally {
              setSigningOut(false);
              setOpen(false);
              onAction?.();
            }
          }}
        >
          {signingOut ? "Wylogowywanie…" : "Wyloguj"}
        </button>
      </div>
    </div>
  );
}

/* =================== MOBILE =================== */
function UserMenuMobile({ user, loading, onAction }) {
  if (loading) {
    return (
      <div
        className="h-10 w-full animate-pulse rounded-xl border border-white/10 bg-white/5"
        aria-busy="true"
      />
    );
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

  const display = user.displayName || user.email || "U";

  return (
    <div className="surface-soft flex flex-col gap-1 rounded-2xl p-2 text-slate-100">
      <div className="flex items-center gap-3 rounded-xl px-3 py-2">
        {user.photoURL && typeof user.photoURL === "string" ? (
          <Image
            src={user.photoURL}
            alt={`Avatar ${display}`}
            width={34}
            height={34}
            sizes="34px"
            className="rounded-full border border-white/10 object-cover"
          />
        ) : (
          <InitialsAvatar name={display} />
        )}
        <div className="text-sm">
          <div className="font-medium text-slate-100">{display}</div>
          <div className="text-slate-400">Zalogowano</div>
        </div>
      </div>

      <Link
        href="/profile"
        onClick={() => onAction?.()}
        className="rounded-xl px-3 py-2 text-slate-100 transition hover:bg-white/10"
      >
        Mój profil
      </Link>

      <Link
        href="/my-cars"
        onClick={() => onAction?.()}
        className="rounded-xl px-3 py-2 text-slate-100 transition hover:bg-white/10"
      >
        Moje samochody
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
        className="w-full rounded-xl px-3 py-2 text-left text-red-300 transition hover:bg-red-500/10"
      >
        Wyloguj
      </button>
    </div>
  );
}

