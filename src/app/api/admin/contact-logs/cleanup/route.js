export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { verifyFirebaseToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, isAdmin: true },
    });
    if (!me || !me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const days = Number(body?.days);
    let statuses = Array.isArray(body?.statuses) ? body.statuses : ['SPAM', 'RATE-LIMIT'];
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: "Bad 'days' param" }, { status: 400 });
    }
    statuses = statuses
      .map((s) => String(s).toUpperCase())
      .filter((s) => s === 'SPAM' || s === 'RATE-LIMIT');
    if (!statuses.length) {
      return NextResponse.json({ error: "Bad 'statuses' param" }, { status: 400 });
    }

    const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const ors = [];
    if (statuses.includes('SPAM')) {
      ors.push({ AND: [{ spam: true }, { createdAt: { lt: before } }, { deletedAt: null }] });
    }
    if (statuses.includes('RATE-LIMIT')) {
      ors.push({
        AND: [{ rateLimited: true }, { createdAt: { lt: before } }, { deletedAt: null }],
      });
    }
    if (!ors.length) return NextResponse.json({ deleted: 0 }, { status: 200 });

    const res = await prisma.contactMessageLog.updateMany({
      where: { OR: ors },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ deleted: res.count }, { status: 200 });
  } catch (e) {
    console.error('POST /api/admin/contact-logs/cleanup error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
