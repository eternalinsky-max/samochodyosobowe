// src/app/companies/[id]/page.jsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import RatingBadge from '@/components/RatingBadge';
import ReviewSection from '@/components/ReviewSection';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getCompany(id) {
  if (!id) return null;
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        website: true,
        verified: true,
        createdAt: true,
        // лише avg + count потрібні для бейджа
        ratingAvg: true,
        ratingCount: true,
        // список вакансій
        Job: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            city: true,
            isRemote: true,
            createdAt: true,
            salaryMin: true,
            salaryMax: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });
    return company;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const c = await getCompany(params.id);
  if (!c) return { title: 'Firma nie została znaleziona' };
  return { title: `${c.name} | proponujeprace.pl` };
}

function Salary({ min, max }) {
  const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString('pl-PL') : null);
  const a = fmt(min);
  const b = fmt(max);
  if (a && b)
    return (
      <span>
        {a}–{b} zł
      </span>
    );
  if (a) return <span>od {a} zł</span>;
  if (b) return <span>do {b} zł</span>;
  return <span className="text-gray-500">Wynagrodzenie nie podano</span>;
}

export default async function CompanyPage({ params }) {
  const company = await getCompany(params.id);
  if (!company) notFound();

  return (
    <section className="px-4 py-6 sm:px-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="shrink-0">
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={`Logo ${company.name}`}
                width={72}
                height={72}
                sizes="72px"
                className="rounded-xl border bg-white object-cover"
              />
            ) : (
              <div className="grid size-[72px] place-items-center rounded-xl border bg-gray-50 text-sm text-gray-600">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold">{company.name}</h1>
              <RatingBadge avg={Number(company.ratingAvg)} count={Number(company.ratingCount)} />
              {company.verified && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  Zweryfikowana
                </span>
              )}
            </div>
            {company.website && (
              <div className="mt-1 text-sm">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              Na platformie od: {new Date(company.createdAt).toLocaleDateString('pl-PL')}
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <Link href="/post-job" className="btn btn-secondary">
              Dodaj ofertę
            </Link>
          </div>
        </div>

        {/* Oferty firmy */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Najnowsze oferty</h2>
          {company.Job.length === 0 ? (
            <div className="rounded-lg border bg-gray-50 p-4 text-gray-600">
              Brak opublikowanych ofert.
            </div>
          ) : (
            <ul className="divide-y rounded-lg border bg-white">
              {company.Job.map((j) => (
                <li key={j.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">
                      {j.title}
                    </Link>
                    <div className="mt-0.5 text-sm text-gray-600">
                      {j.isRemote ? 'Zdalnie' : j.city || '—'} ·{' '}
                      <Salary min={j.salaryMin} max={j.salaryMax} />
                    </div>
                  </div>
                  <RatingBadge avg={Number(j.ratingAvg)} count={Number(j.ratingCount)} />
                  <div className="w-24 text-right text-xs text-gray-500">
                    {new Date(j.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Opinie o firmie */}
        <ReviewSection targetType="COMPANY" targetId={company.id} />
      </div>
    </section>
  );
}
