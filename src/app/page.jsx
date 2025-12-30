// src/app/page.jsx
import Image from 'next/image';
import Link from 'next/link';

import JobCardList from '@/components/JobCardList';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // важливо: Prisma працює у Node, не на Edge
export const dynamic = 'force-dynamic'; // щоб список був свіжим на кожен запит

async function getLatestJobs() {
  return prisma.job.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      isRemote: true,
      salaryMin: true,
      salaryMax: true,
      createdAt: true,
      ratingAvg: true,
      ratingCount: true,
      Company: { select: { id: true, name: true, logoUrl: true } },
    },
  });
}

export default async function HomePage() {
  const latestJobs = await getLatestJobs();

  return (
    <section className="grid gap-10 px-4 sm:px-6">
      {/* Hero */}
      <div className="from-brand-50 relative overflow-hidden rounded-2xl border bg-gradient-to-br via-white to-white shadow-soft">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative grid items-center gap-8 p-8 sm:p-10 md:grid-cols-2 md:p-14">
          {/* Текст */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              Znajdź pracę szybciej. <span className="text-brand-600">Dodaj</span>, oceniaj,
              aplikuj.
            </h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              Prosty portal ogłoszeń pracy dla Polski. Rejestracja przez Google lub telefon. Oceny
              pracodawców i pracowników.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/jobs" className="btn btn-primary transition-transform hover:scale-105">
                Przeglądaj oferty
              </Link>
              <Link
                href="/post-job"
                className="btn btn-secondary transition-transform hover:scale-105"
              >
                Dodaj ofertę
              </Link>
            </div>
          </div>

          {/* Ілюстрація з public/ */}
          <div className="flex justify-center">
            <div className="relative h-[240px] w-full max-w-[520px] sm:h-[300px] md:h-[360px]">
              <Image
                src="/images/hero-work.png"
                alt="Znajdź pracę szybciej"
                fill
                sizes="(min-width: 768px) 520px, 100vw"
                className="rounded-xl object-cover"
                priority
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Najnowsze oferty */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Najnowsze oferty</h2>
          <Link href="/jobs" className="text-brand-700 text-sm hover:underline">
            Zobacz wszystkie →
          </Link>
        </div>

        {latestJobs?.length ? (
          <JobCardList jobs={latestJobs} defaultView="list" />
        ) : (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            Brak nowych ofert.{' '}
            <Link href="/post-job" className="text-brand-700 hover:underline">
              Dodaj pierwszą!
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
