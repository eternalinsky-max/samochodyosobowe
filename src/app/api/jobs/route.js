// src/app/api/jobs/route.js
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs — публічний список вакансій
 * Query:
 *   page (default 1)
 *   perPage (default 12, max 100)
 *   sort: createdAt|salaryMin|salaryMax|bayesScore|ratingAvg  (default: createdAt)
 *   dir:  asc|desc  (default: desc)
 *   status: "ACTIVE" (default) | "HIDDEN" | "DRAFT" ...
 *   city: substring (case-insensitive)
 *   remote: "1" (лише з віддаленою), "0" (лише офіс), "" (будь-які)
 *   q: пошук по title/description/tagsCsv (case-insensitive contains)
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);

    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const perRaw = Number(url.searchParams.get('perPage') || '12');
    const perPage = Math.min(100, Math.max(1, perRaw));

    const sort = (url.searchParams.get('sort') || 'createdAt').toString();
    const dir = (url.searchParams.get('dir') || 'desc') === 'asc' ? 'asc' : 'desc';
    const status = (url.searchParams.get('status') || 'ACTIVE').toString();
    const city = (url.searchParams.get('city') || '').trim();
    const remote = (url.searchParams.get('remote') || '').trim(); // "1" | "0" | ""
    const q = (url.searchParams.get('q') || '').trim();

    const allowedSort = new Set(['createdAt', 'salaryMin', 'salaryMax', 'bayesScore', 'ratingAvg']);
    const orderByField = allowedSort.has(sort) ? sort : 'createdAt';
    const orderBy = { [orderByField]: dir };

    /** @type {import('@prisma/client').Prisma.JobWhereInput} */
    const where = {};
    if (status) where.status = status || 'ACTIVE';
    if (remote === '1') where.isRemote = true;
    else if (remote === '0') where.isRemote = false;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tagsCsv: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          isRemote: true,
          salaryMin: true,
          salaryMax: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          ratingAvg: true,
          ratingCount: true,
          ratingSum: true,
          bayesScore: true,
          companyId: true,
          ownerId: true,
          Company: { select: { id: true, name: true, logoUrl: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const hasNext = page < totalPages;

    return NextResponse.json({
      ok: true,
      items,
      page,
      perPage,
      total,
      totalPages,
      hasNext,
    });
  } catch (e) {
    console.error('[GET /api/jobs] error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/jobs — створення вакансії (Firebase Bearer token)
 * Body: { title, description, city?, isRemote?, salaryMin?, salaryMax?, tagsCsv?, status? }
 * Компанія створюється/підхоплюється автоматично з профілю власника.
 */
export async function POST(req) {
  try {
    // ----- auth -----
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7).trim() : null;
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // ----- body -----
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    let {
      title = '',
      description = '',
      city = null,
      isRemote = false,
      salaryMin = null,
      salaryMax = null,
      tagsCsv = '',
      status = 'ACTIVE',
    } = body || {};

    title = String(title || '').trim();
    description = String(description || '');
    city = city ? String(city).trim() : null;
    tagsCsv = String(tagsCsv || '').trim();
    status = String(status || 'ACTIVE').trim() || 'ACTIVE';
    isRemote = Boolean(isRemote);

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    // ----- normalize salaries (Int в Postgres: ±2_147_483_647) -----
    const INT_MAX = 2_147_483_647;
    const toIntOrNull = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number.parseInt(String(v), 10);
      if (Number.isNaN(n)) return null;
      return Math.max(Math.min(n, INT_MAX), 0);
    };
    let salaryMinNum = toIntOrNull(salaryMin);
    let salaryMaxNum = toIntOrNull(salaryMax);
    if (salaryMinNum != null && salaryMaxNum != null && salaryMinNum > salaryMaxNum) {
      // міняємо місцями, якщо переплутані
      [salaryMinNum, salaryMaxNum] = [salaryMaxNum, salaryMinNum];
    }

    // ----- ensure owner user -----
    const owner = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        id: decoded.uid, // якщо у схемі String @id без default
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
        phone: decoded.phone_number ?? null,
        photoUrl: decoded.picture ?? null,
      },
      update: {
        email: decoded.email ?? undefined,
        displayName: decoded.name ?? undefined,
        phone: decoded.phone_number ?? undefined,
        photoUrl: decoded.picture ?? undefined,
      },
      select: { id: true, displayName: true, email: true },
    });

    // ----- ensure company for owner (перша або створити якщо немає) -----
    let company = await prisma.company.findFirst({
      where: { ownerId: owner.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          id: randomUUID(), // бо Company.id теж String @id у твоїй схемі
          ownerId: owner.id,
          name: owner.displayName || owner.email || 'Moja firma',
          verified: false,
        },
        select: { id: true, name: true },
      });
    }

    // ----- create job (ОБОВ’ЯЗКОВО з id: randomUUID()) -----
    const job = await prisma.job.create({
      data: {
        id: randomUUID(), // <— оце головне виправлення
        title,
        description,
        city,
        isRemote,
        salaryMin: salaryMinNum,
        salaryMax: salaryMaxNum,
        tagsCsv,
        status,
        ownerId: owner.id,
        companyId: company.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        isRemote: true,
        salaryMin: true,
        salaryMax: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        ratingAvg: true,
        ratingCount: true,
        ratingSum: true,
        bayesScore: true,
        companyId: true,
        ownerId: true,
        Company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/jobs] error:', err);
    if (err?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Foreign key violation: companyId/ownerId' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
