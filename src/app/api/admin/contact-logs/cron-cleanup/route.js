import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = globalThis._prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis._prisma = prisma;

const RETENTION_DAYS = Number(process.env.CONTACT_LOGS_RETENTION_DAYS || 30);
const HARD_DELETE_AFTER_DAYS = Number(process.env.CONTACT_LOGS_HARD_DELETE_AFTER_DAYS || 14);

export const runtime = 'nodejs';

export async function POST(req) {
  // 🚧 1) Дозволяємо лише продакшен
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: 'Cron allowed only in production' }, { status: 403 });
  }

  // 🔐 2) Перевірка секрету
  const headerSecret = req.headers.get('x-cron-secret');
  if (!headerSecret || headerSecret !== process.env.CRON_CLEANUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const softDeleteBefore = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const hardDeleteBefore = new Date(
      now.getTime() - (RETENTION_DAYS + HARD_DELETE_AFTER_DAYS) * 24 * 60 * 60 * 1000,
    );

    // 3) Soft-delete старих записів
    const softResult = await prisma.contactMessageLog.updateMany({
      where: { deletedAt: null, createdAt: { lt: softDeleteBefore } },
      data: { deletedAt: now },
    });

    // 4) Hard-delete дуже старих (які вже soft-deleted)
    const hardResult = await prisma.contactMessageLog.deleteMany({
      where: { deletedAt: { lt: hardDeleteBefore } },
    });

    return NextResponse.json({
      ok: true,
      retentionDays: RETENTION_DAYS,
      hardDeleteAfterDays: HARD_DELETE_AFTER_DAYS,
      softDeletedCount: softResult.count,
      hardDeletedCount: hardResult.count,
      ranAt: now.toISOString(),
    });
  } catch (err) {
    console.error('[CRON] cleanup error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ❌ Блок на інші методи (GET/PUT/…)
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
