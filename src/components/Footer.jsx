'use client';

import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10">
        
        {/* TOP */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* BRAND */}
          <div>
            <p className="text-lg font-semibold text-white">
              SAUTOM
            </p>
            <p className="mt-1 text-sm font-medium text-gray-400">
              samochody w Polsce
            </p>
            <p className="mt-3 text-sm text-gray-400">
              Katalog nowych samochodów dostępnych w Polsce.
            </p>
          </div>

          {/* CARS */}
          <div>
            <p className="mb-2 text-sm font-semibold text-white">
              Samochody
            </p>
            <ul className="space-y-1 text-sm">
              <li><Link href="/cars" className="hover:text-white">Wszystkie auta</Link></li>
              <li><Link href="/cars?bodyType=SUV" className="hover:text-white">SUV</Link></li>
              <li><Link href="/cars?fuel=HYBRID" className="hover:text-white">Hybrydy</Link></li>
              <li><Link href="/cars?fuel=ELECTRIC" className="hover:text-white">Elektryczne</Link></li>
            </ul>
          </div>

          {/* INFO */}
          <div>
            <p className="mb-2 text-sm font-semibold text-white">
              Informacje
            </p>
            <ul className="space-y-1 text-sm">
              <li><Link href="/brands" className="hover:text-white">Marki</Link></li>
              <li><Link href="/compare" className="hover:text-white">Porównanie</Link></li>
              <li><Link href="/contact" className="hover:text-white">Kontakt</Link></li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <p className="mb-2 text-sm font-semibold text-white">
              Prawo
            </p>
            <ul className="space-y-1 text-sm">
              <li><Link href="/terms" className="hover:text-white">Regulamin</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Polityka prywatności</Link></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-sm text-gray-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} sautom.pl
          </span>
          <span>
            Dane mają charakter informacyjny i nie stanowią oferty handlowej.
          </span>
        </div>
      </div>
    </footer>
  );
}
