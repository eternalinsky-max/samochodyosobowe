'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      {/* Ілюстрація */}
      <Image
        src="/404.svg"
        alt="404 - Strona nie została znaleziona"
        width={288} // відповідає приблизно w-72
        height={288}
        className="mb-8 h-auto"
        priority
      />

      {/* Заголовки */}
      <h1 className="mb-3 text-4xl font-extrabold text-brand-600 sm:text-5xl">404</h1>
      <h2 className="mb-3 text-xl font-semibold sm:text-2xl">Strona nie została znaleziona</h2>
      <p className="mb-6 max-w-md text-gray-600">
        Ups… wygląda na to, że ta strona nie istnieje albo została przeniesiona.
      </p>

      {/* Кнопка */}
      <Link href="/" className="btn btn-primary transition-transform hover:scale-105">
        ← Wróć na stronę główną
      </Link>

      {/* Підпис унизу */}
      <p className="mt-10 text-sm text-gray-400">© {new Date().getFullYear()} proponujeprace.pl</p>
    </main>
  );
}
