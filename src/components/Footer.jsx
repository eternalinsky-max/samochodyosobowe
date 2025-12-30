'use client';

import { Home, TreePine, Sunrise, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// детермінований хеш, без randomness
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function SiteFooter() {
  const pathname = usePathname() || '/';

  const icons = [Home, TreePine, Sunrise, HeartHandshake];
  const Icon = useMemo(() => {
    const idx = hashString(pathname) % icons.length;
    return icons[idx];
  }, [pathname]);

  return (
    <footer className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:flex sm:items-center sm:justify-between">

        {/* LEFT SECTION */}
        <div>
          <p className="text-lg font-semibold text-white">proponujeprace.pl</p>
          <p className="text-gray-400 mb-2">
            Znajdź pracę szybciej. Dodawaj, oceniaj, aplikuj.
          </p>
          <p className="text-gray-500">
            © {new Date().getFullYear()} Wszystkie prawa zastrzeżone
          </p>
        </div>

        {/* CENTER LINKS */}
        <nav className="mt-6 flex flex-wrap gap-4 text-sm sm:mt-0">
          <Link href="/terms" className="hover:text-white transition">Regulamin</Link>
          <Link href="/privacy" className="hover:text-white transition">Polityka prywatności</Link>
          <Link href="/contact" className="hover:text-white transition">Kontakt</Link>
        </nav>

        {/* RIGHT SIDE (EMPTY FOR NOW) */}
        <div className="mt-6 sm:mt-0"></div>
      </div>

      {/* BOTTOM QUOTE */}
      <div
        className="border-t border-gray-700 py-4 flex items-center justify-center gap-2 text-gray-400 italic text-sm"
        suppressHydrationWarning
      >
        <Icon className="size-4 text-gray-500" />
        <span>
          Cokolwiek czynicie, z duszy wykonujcie 
        </span>
      </div>
    </footer>
  );
}
