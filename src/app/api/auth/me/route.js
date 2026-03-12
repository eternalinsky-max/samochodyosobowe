// src/app/api/auth/me/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function json(ok, data, init = {}) {
  return NextResponse.json(ok ? { ok: true, data } : { ok: false, error: data }, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

function getBearer(req) {
  const authz = req.headers.get("authorization") || "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export async function GET(req) {
  try {
    const token = getBearer(req);
    if (!token) {
      return json(false, { code: "UNAUTHORIZED", message: "Missing bearer token" }, { status: 401 });
    }

    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.uid) {
      return json(false, { code: "UNAUTHORIZED", message: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        // ⚠️ НЕ ставимо id вручну — хай Prisma згенерує, якщо в схемі @default(cuid())
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
        firebaseUid: true,
        displayName: true,
        email: true,
        phone: true,
        photoUrl: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return json(true, user, { status: 200 });
  } catch (e) {
    console.error("GET /api/auth/me error:", e?.stack || e?.message || e);
    return json(false, { code: "INTERNAL", message: "Internal Server Error" }, { status: 500 });
  }
}
