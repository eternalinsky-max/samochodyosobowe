// src/app/api/my-jobs/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1) Пробуємо забрати токен з нашого спеціального заголовка
    let token = req.headers.get('x-id-token') || '';

    // 2) Фолбек: якщо раптом будемо колись слати Bearer
    if (!token) {
      const authHeader = req.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'NO_TOKEN' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (err) {
      console.error('verifyIdToken error in /api/my-jobs:', err);
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });
    }

    // поточний користувач
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    });

    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // параметри з URL
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const perPageRaw = Number(url.searchParams.get('perPage') || '10');
    const perPage = Math.min(50, Math.max(1, perPageRaw));

    const status = (url.searchParams.get('status') || '').trim();
    const city = (url.searchParams.get('city') || '').trim();
    const remote = url.searchParams.get('remote'); // "1" | "0" | null

    const where = {
      ownerId: me.id,
    };

    if (status) where.status = status;
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }
    if (remote === '1') where.isRemote = true;
    if (remote === '0') where.isRemote = false;

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage + 1,
        include: {
          Company: {
            select: { id: true, name: true, logoUrl: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const hasNext = items.length > perPage;
    const sliced = hasNext ? items.slice(0, perPage) : items;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({
      items: sliced,
      total,
      totalPages,
      hasNext,
    });
  } catch (e) {
    console.error('GET /api/my-jobs error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
