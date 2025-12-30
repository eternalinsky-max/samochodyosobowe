export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { verifyFirebaseToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    // auth
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, isAdmin: true },
    });
    if (!me || !me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const perPage = Math.min(Math.max(Number(searchParams.get('perPage')) || 20, 1), 100);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const status = (searchParams.get('status') || '').toUpperCase();

    const whereOr = q
      ? {
          OR: [
            { ip: { contains: q } },
            { name: { contains: q } },
            { email: { contains: q } },
            { message: { contains: q } },
            { provider: { contains: q } },
            { error: { contains: q } },
          ],
        }
      : {};

    // Базово: показуємо лише не видалені
    let base = { deletedAt: null, ...whereOr };

    // Фільтр статусу (включає soft-deleted)
    if (status === 'OK') {
      base = {
        AND: [
          { success: true },
          { spam: false },
          { rateLimited: false },
          { deletedAt: null },
          whereOr,
        ],
      };
    } else if (status === 'SPAM') {
      base = { AND: [{ spam: true }, { deletedAt: null }, whereOr] };
    } else if (status === 'RATE-LIMIT') {
      base = { AND: [{ rateLimited: true }, { deletedAt: null }, whereOr] };
    } else if (status === 'ERROR') {
      base = {
        AND: [
          { success: false },
          { spam: false },
          { rateLimited: false },
          { deletedAt: null },
          whereOr,
        ],
      };
    } else if (status === 'DELETED') {
      base = { AND: [{ deletedAt: { not: null } }, whereOr] };
    }

    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      prisma.contactMessageLog.findMany({
        where: base,
        orderBy: [{ deletedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: perPage,
        select: {
          id: true,
          createdAt: true,
          ip: true,
          userAgent: true,
          name: true,
          email: true,
          message: true,
          messageLen: true,
          spam: true,
          rateLimited: true,
          success: true,
          provider: true,
          providerMessageId: true,
          error: true,
          retryAfterSec: true,
          deletedAt: true,
        },
      }),
      prisma.contactMessageLog.count({ where: base }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({ items, page, perPage, total, totalPages }, { status: 200 });
  } catch (e) {
    console.error('GET /api/admin/contact-logs error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
