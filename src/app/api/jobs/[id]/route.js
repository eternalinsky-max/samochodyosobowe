// src/app/api/jobs/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — як було
export async function GET(_req, { params }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      Company: {
        select: { id: true, name: true, logoUrl: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}

// PUT — оновлення оферти
export async function PUT(req, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // хто ми
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, isAdmin: true },
    });

    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // яку вакансію редагуємо
    const existing = await prisma.job.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // лише власник або адмін
    if (!me.isAdmin && existing.ownerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Дозволені поля для оновлення
    const {
      title,
      description,
      city,
      isRemote,
      salaryMin,
      salaryMax,
      status,
      tagsCsv,
    } = body;

    const data = {};

    if (typeof title === 'string') data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (typeof city === 'string') data.city = city.trim();

    if (typeof isRemote === 'boolean') data.isRemote = isRemote;

    if (salaryMin !== undefined) {
      const v = Number(salaryMin);
      data.salaryMin = Number.isFinite(v) ? v : null;
    }
    if (salaryMax !== undefined) {
      const v = Number(salaryMax);
      data.salaryMax = Number.isFinite(v) ? v : null;
    }

    if (typeof status === 'string' && status.trim()) {
      data.status = status.trim(); // напр. "ACTIVE" | "HIDDEN" | "DRAFT"
    }

    if (typeof tagsCsv === 'string') {
      data.tagsCsv = tagsCsv;
    }

    // нічого не передали — нема що оновлювати
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.job.update({
      where: { id },
      data,
      include: {
        Company: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT /api/jobs/[id] error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — як ми робили раніше
export async function DELETE(req, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, isAdmin: true },
    });

    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!me.isAdmin && job.ownerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('DELETE /api/jobs/[id] error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
