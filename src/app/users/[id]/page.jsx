// src/app/users/[id]/page.jsx
import Image from 'next/image';
import { notFound } from 'next/navigation';

import RatingBadge from '@/components/RatingBadge';
import ReviewSection from '@/components/ReviewSection';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getUserPublic(id) {
  if (!id) return null;
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        createdAt: true,
        // рейтинги як працівника (avg + count)
        ratingWorkerAvg: true,
        ratingWorkerCount: true,
        // тизер останніх відгуків
        Review: {
          where: { targetType: 'USER', targetId: id, isHidden: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            ratingOverall: true,
            text: true,
            createdAt: true,
            User: { select: { id: true, displayName: true, photoUrl: true } },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const u = await getUserPublic(params.id);
  if (!u) return { title: 'Użytkownik nie został znaleziony' };
  return { title: `${u.displayName || 'Użytkownik'} | proponujeprace.pl` };
}

export default async function UserProfilePublicPage({ params }) {
  const u = await getUserPublic(params.id);
  if (!u) notFound();

  const name = u.displayName || 'Użytkownik';

  return (
    <section className="px-4 py-6 sm:px-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="shrink-0">
            {u.photoUrl ? (
              <Image
                src={u.photoUrl}
                alt={`Avatar ${name}`}
                width={72}
                height={72}
                sizes="72px"
                className="rounded-full border bg-white object-cover"
              />
            ) : (
              <div className="grid size-[72px] place-items-center rounded-full border bg-gray-50 text-sm text-gray-600">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold">{name}</h1>
              <RatingBadge avg={Number(u.ratingWorkerAvg)} count={Number(u.ratingWorkerCount)} />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Na platformie od: {new Date(u.createdAt).toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>

        {/* Тизер останніх відгуків */}
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Ostatnie opinie</h2>
          {u.Review.length === 0 ? (
            <div className="rounded-lg border bg-gray-50 p-4 text-gray-600">Brak opinii.</div>
          ) : (
            <ul className="divide-y rounded-lg border bg-white">
              {u.Review.map((r) => (
                <li key={r.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{r.User?.displayName || 'Użytkownik'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                  <div className="mt-1 text-sm">Ocena: {r.ratingOverall}/5</div>
                  {r.text && <p className="mt-1 text-sm text-gray-700">{r.text}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Повна секція з формою/пагінацією */}
        <ReviewSection targetType="USER" targetId={u.id} />
      </div>
    </section>
  );
}
