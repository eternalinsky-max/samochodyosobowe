// src/app/api/reviews/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

const PRIOR_MEAN = 4.0;
const PRIOR_WEIGHT = 5;

function computeBayes(avg, count) {
  const m = PRIOR_MEAN;
  const C = PRIOR_WEIGHT;
  return (C * m + count * avg) / (C + count);
}

async function recomputeAggregatesTx(tx, targetType, targetId) {
  const where = { targetType, targetId, isHidden: false };
  const agg = await tx.review.aggregate({
    where,
    _count: { _all: true },
    _sum: { ratingOverall: true },
  });

  const count = agg._count._all || 0;
  const sum = agg._sum.ratingOverall || 0;
  const avg = count > 0 ? sum / count : 0;
  const bayesScore = computeBayes(avg || 0, count);

  if (targetType === "USER") {
    await tx.user.update({
      where: { id: targetId },
      data: {
        ratingWorkerCount: count,
        ratingWorkerSum: sum,
        ratingWorkerAvg: avg,
        ratingWorkerBayesScore: bayesScore,
      },
    });
  }

  return { count, sum, avg, bayesScore };
}

// GET /api/reviews?targetType=LISTING|USER&targetId=...&page=1&perPage=10
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetType = (searchParams.get("targetType") || "").toUpperCase();
    const targetId = (searchParams.get("targetId") || "").trim();
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const perPage = Math.min(Math.max(Number(searchParams.get("perPage")) || 10, 1), 50);

    if (!["LISTING", "USER"].includes(targetType) || !targetId) {
      return NextResponse.json({ error: "Bad params" }, { status: 400 });
    }

    const skip = (page - 1) * perPage;

    const rowsPlusOne = await prisma.review.findMany({
      where: { targetType, targetId, isHidden: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage + 1,
      select: {
        id: true,
        ratingOverall: true,
        text: true,
        createdAt: true,
        authorId: true,
        User: { select: { id: true, displayName: true, photoUrl: true } },
      },
    });

    const hasNext = rowsPlusOne.length > perPage;
    const items = hasNext ? rowsPlusOne.slice(0, perPage) : rowsPlusOne;

    let total = null;
    let totalPages = null;
    try {
      total = await prisma.review.count({
        where: { targetType, targetId, isHidden: false },
      });
      totalPages = Math.max(1, Math.ceil(total / perPage));
    } catch (err) {
      console.error("count /api/reviews failed:", err);
      totalPages = hasNext ? page + 1 : page;
    }

    return NextResponse.json(
      { items, page, perPage, hasNext, total, totalPages },
      { status: 200 },
    );
  } catch (e) {
    console.error("GET /api/reviews error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "NO_TOKEN" }, { status: 401 });

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetType = String(body.targetType || "").toUpperCase();
    const targetId = String(body.targetId || "").trim();
    const ratingOverall = Number(body.ratingOverall || 0);
    const text = String(body.text || "").trim().slice(0, 3000);

    if (!["LISTING", "USER"].includes(targetType)) {
      return NextResponse.json({ error: "Bad targetType" }, { status: 400 });
    }
    if (!targetId) return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
    if (!(ratingOverall >= 1 && ratingOverall <= 5)) {
      return NextResponse.json({ error: "ratingOverall 1..5" }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 400 });

    if (targetType === "LISTING") {
      const ok = await prisma.carListing.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!ok) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    } else if (targetType === "USER") {
      const ok = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!ok) return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const out = await prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: {
          authorId_targetType_targetId: {
            authorId: me.id,
            targetType,
            targetId,
          },
        },
        update: { ratingOverall, text, isHidden: false },
        create: {
          id: randomUUID(),
          authorId: me.id,
          targetType,
          targetId,
          ratingOverall,
          text,
        },
        select: {
          id: true,
          ratingOverall: true,
          text: true,
          createdAt: true,
          authorId: true,
        },
      });

      const agg = await recomputeAggregatesTx(tx, targetType, targetId);
      return { review, agg };
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    console.error("POST /api/reviews error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
