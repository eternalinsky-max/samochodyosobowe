// src/app/api/users/[id]/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/** GET /api/users/[id] — публічний профіль користувача (як працівника) */
export async function GET(_req, { params }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,

        // поля рейтингу як працівника
        ratingWorkerAvg: true,
        ratingWorkerCount: true,
        ratingWorkerSum: true,
        ratingWorkerBayesScore: true,

        // (опц.) базові метадані
        createdAt: true,

        // (опц.) останні відгуки про цього користувача
        Review: {
          where: { targetType: 'USER', targetId: id, isHidden: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            ratingOverall: true,
            text: true,
            createdAt: true,
            User: { select: { id: true, displayName: true, photoUrl: true } }, // автор відгуку
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(user, { status: 200 });
  } catch (e) {
    console.error('GET /api/users/[id] error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
