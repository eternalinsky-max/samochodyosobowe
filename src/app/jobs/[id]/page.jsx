// src/app/jobs/[id]/page.jsx
import Image from "next/image";
import Link from "next/link";

import JobActions from "@/components/JobActions";
import JobRatingBadge from "@/components/JobRatingBadge";
import ReviewSection from "@/components/ReviewSection";
import { prisma } from "@/lib/prisma";
import { autoLink } from "@/lib/autoLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Завантаження вакансії
async function getJob(id) {
  return prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      isRemote: true,
      salaryMin: true,
      salaryMax: true,
      createdAt: true,
      status: true,
      ownerId: true,
      ratingAvg: true,
      ratingCount: true,
      Company: { select: { id: true, name: true, logoUrl: true } },
      User: {
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
          firebaseUid: true,
        },
      },
    },
  });
}

// SEO
export async function generateMetadata({ params }) {
  const job = await getJob(params.id);
  if (!job) return { title: "Oferta nie została znaleziona" };
  const place = job.isRemote ? "Zdalnie" : job.city ?? "—";
  return { title: `${job.title} – ${place} | proponujeprace.pl` };
}

function Salary({ min, max }) {
  const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString("pl-PL") : null);
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

export default async function JobDetailsPage({ params }) {
  const job = await getJob(params.id);
  if (!job) {
    return (
      <section className="p-6 text-red-600">Oferta nie została znaleziona.</section>
    );
  }

  const companyName = job.Company?.name ?? "—";
  const logoUrl = job.Company?.logoUrl ?? null;

  return (
    <section className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {/* Шапка */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`Logo ${companyName}`}
                width={64}
                height={64}
                sizes="64px"
                className="rounded-xl border bg-white object-cover"
              />
            ) : (
              <div className="grid size-16 place-items-center rounded-xl border bg-gray-50 text-xs text-gray-500">
                {companyName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{job.title}</h1>
              <JobRatingBadge avg={Number(job.ratingAvg)} count={Number(job.ratingCount)} />
            </div>
            <div className="mt-1 text-sm text-gray-700">
              {job.Company ? (
                <Link href={`/companies/${job.Company.id}`} className="text-brand-600 hover:underline">
                  {companyName}
                </Link>
              ) : (
                companyName
              )}
              <span className="ml-2">· {job.isRemote ? "Zdalnie" : job.city || "—"}</span>
            </div>
          </div>

          <div className="ml-auto">
            <JobActions job={job} />
          </div>
        </div>

        {/* Інфо-блоки */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="text-gray-500">Wynagrodzenie</div>
            <div className="font-medium">
              <Salary min={job.salaryMin} max={job.salaryMax} />
            </div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{job.status}</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="text-gray-500">Dodano</div>
            <div className="font-medium">
              {job.createdAt ? new Date(job.createdAt).toLocaleDateString("pl-PL") : "—"}
            </div>
          </div>
        </div>

        {/* Опис з автолінками */}
        {job.description && (
          <div className="prose mt-6 max-w-none">
            <h2 className="mb-2 text-lg font-semibold">Opis</h2>
            <div
              className="text-gray-800"
              dangerouslySetInnerHTML={{
                __html: autoLink(job.description),
              }}
            />
          </div>
        )}

        {/* Opinie */}
        <ReviewSection targetType="JOB" targetId={job.id} />
      </div>
    </section>
  );
}
