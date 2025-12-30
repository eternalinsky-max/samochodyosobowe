'use client';

import {
  Briefcase,
  Facebook,
  Hammer,
  Handshake,
  Home,
  Instagram,
  Leaf,
  Linkedin,
  Sunrise,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

function hashString(s) {
  // простий детермінований хеш (без Math.random / Date.now)
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const pathname = usePathname() || '/';

  // 🧠 детермінований вибір іконки за шляхом
  const icons = [Home, Leaf, Briefcase, Handshake, Hammer, Sunrise];
  const Icon = useMemo(() => {
    const idx = hashString(pathname) % icons.length;
    return icons[idx];
  }, [pathname]);

  return (
    <footer className="mt-10 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:flex sm:items-center sm:justify-between">
        <div className="text-sm">
          <p className="font-medium text-white">proponujeprace.pl</p>
          <p className="text-gray-400">© {year} Wszystkie prawa zastrzeżone</p>
        </div>

        <nav className="mt-4 flex flex-wrap items-center gap-4 text-sm sm:mt-0">
          <Link href="/terms" className="transition hover:text-white">
            Regulamin
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Polityka prywatności
          </Link>
          <Link href="/contact" className="transition hover:text-white">
            Kontakt
          </Link>
        </nav>

        <div className="mt-4 flex items-center gap-4 sm:mt-0">
          <Link
            href="https://facebook.com"
            target="_blank"
            className="transition hover:text-blue-400"
          >
            <Facebook className="size-5" />
          </Link>
          <Link
            href="https://instagram.com"
            target="_blank"
            className="transition hover:text-pink-400"
          >
            <Instagram className="size-5" />
          </Link>
          <Link
            href="https://linkedin.com"
            target="_blank"
            className="transition hover:text-sky-400"
          >
            <Linkedin className="size-5" />
          </Link>
        </div>
      </div>

      {/* детермінований блок — без гідраційних розбіжностей */}
      <div
        className="flex items-center justify-center gap-2 border-t border-gray-700 py-4 text-center text-sm italic text-gray-400"
        suppressHydrationWarning
      >
        <Icon className="size-4 text-gray-500" />
        <span>
          Cokolwiek czynicie, z duszy wykonujcie...
                  </span>
      </div>
    </footer>
  );
}
