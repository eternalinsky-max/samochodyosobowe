// src/app/api/reviews/[id]/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { verifyFirebaseToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRIOR_MEAN = 4.0;
const PRIOR_WEIGHT = 5;

async function recomputeAfter(targetType, targetId) {
  const where = { targetType, targetId, isHidden: false };
  const agg = await prisma.review.aggregate({
    where,
    _count: { _all: true },
    _sum: { ratingOverall: true },
  });

  const count = agg._count._all || 0;
  const sum = agg._sum.ratingOverall || 0;
  const avg = count > 0 ? sum / count : 0;
  const bayesScore = (PRIOR_WEIGHT * PRIOR_MEAN + count * avg) / (PRIOR_WEIGHT + count);

  if (targetType === "JOB") {
    await prisma.job.update({
      where: { id: targetId },
      data: { ratingCount: count, ratingSum: sum, ratingAvg: avg, bayesScore },
    });
  } else if (targetType === "COMPANY") {
    await prisma.company.update({
      where: { id: targetId },
      data: { ratingCount: count, ratingSum: sum, ratingAvg: avg, bayesScore },
    });
  } else if (targetType === "USER") {
    await prisma.user.update({
      where: { id: targetId },
      data: {
        ratingWorkerCount: count,
        ratingWorkerSum: sum,
        ratingWorkerAvg: avg,
        ratingWorkerBayesScore: bayesScore,
      },
    });
  }
}

export async function DELETE(req, { params }) {
  try {
    // auth
    const authHeader = req.headers.get("authorization") || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1] || null;

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = String(params?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // автор
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const found = await prisma.review.findUnique({
      where: { id },
      select: { id: true, authorId: true, targetType: true, targetId: true },
    });

    // Якщо відгук уже видалено — вважай успіхом (idempotent)
    if (!found) return NextResponse.json({ ok: true }, { status: 200 });

    if (found.authorId !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });
    await recomputeAfter(found.targetType, found.targetId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("DELETE /api/reviews/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
