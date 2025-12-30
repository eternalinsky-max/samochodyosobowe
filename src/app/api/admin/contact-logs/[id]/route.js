export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { verifyFirebaseToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req, { params }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, isAdmin: true },
    });
    if (!me || !me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const res = await prisma.contactMessageLog.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: res.id }, { status: 200 });
  } catch (e) {
    console.error('DELETE /api/admin/contact-logs/[id] error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
