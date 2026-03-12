"use client";
/* eslint-env browser */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import UserMenu from "@/components/UserMenu";

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo(
    () => [
      { href: "/", label: "Start" },
      { href: "/cars", label: "Samochody" },
      { href: "/brands", label: "Marki" },
      { href: "/compare", label: "Porównanie" },
      { href: "/contact", label: "Kontakt" },
    ],
    []
  );

  const linkBase =
    "px-3 py-2 rounded-xl text-sm font-semibold transition " +
    "hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10";

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <>
      {/* NAVBAR */}
      <header
        className={
          "sticky top-0 z-50 w-full " +
          // темна “плівка” + blur
          "backdrop-blur-xl " +
          // на home робимо трохи прозоріше, щоб hero виглядав круто
          (isHome
            ? "bg-black/35 border-b border-white/10"
            : "bg-black/55 border-b border-white/10")
        }
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              {/* якщо у тебе є файл лого, підстав тут */}
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <Image
                  src="/logo-128x128.png"
                  alt="SAMOCHODY OSOBOWE"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>

              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-wide text-white">
                  SAMOCHODY
                </div>
                <div className="text-[11px] font-semibold tracking-widest text-white/70">
                  OSOBOWE.PL
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    linkBase +
                    " " +
                    (isActive(it.href)
                      ? "text-white bg-white/10 ring-1 ring-white/15"
                      : "text-white/75")
                  }
                >
                  {it.label}
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                aria-label="Menu"
                onClick={() => setOpen((v) => !v)}
              >
                <span className="text-lg leading-none">{open ? "×" : "☰"}</span>
              </button>

              {/* User menu */}
             <div className="px-1 py-1">
  <UserMenu />
</div>
            </div>
          </div>
        </div>

        {/* Mobile panel */}
        {open ? (
          <div className="md:hidden border-t border-white/10 bg-black/65 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-1">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "px-3 py-2 rounded-xl text-sm font-semibold " +
                    (isActive(it.href)
                      ? "bg-white/10 text-white ring-1 ring-white/15"
                      : "text-white/80 hover:bg-white/10")
                  }
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {/* На випадок якщо захочеш fixed замість sticky: тут можна додати spacer */}
      {/* <div className="h-16" /> */}
    </>
  );
}