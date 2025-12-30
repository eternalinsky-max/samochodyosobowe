// src/app/api/auth/me/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { verifyFirebaseToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const authz = req.headers.get("authorization") || "";
    const m = authz.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1]?.trim() || null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyFirebaseToken(token).catch(() => null);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        id: decoded.uid, // якщо в схемі немає @default(cuid())
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
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        photoUrl: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("GET /api/auth/me error:", e?.stack || e?.message || e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
