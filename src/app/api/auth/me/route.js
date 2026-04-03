import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    // 🔐 отримуємо token
    const authHeader = req.headers.get("authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "NO_TOKEN" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // 🔐 перевірка Firebase
    const decoded = await adminAuth.verifyIdToken(token);

    // 🔥 UPSERT USER
    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },

      update: {
        email: decoded.email || null,
        displayName: decoded.name || null,
        photoUrl: decoded.picture || null,
      },

      create: {
        firebaseUid: decoded.uid,
        email: decoded.email || null,
        displayName: decoded.name || null,
        photoUrl: decoded.picture || null,
      },
    });

    return NextResponse.json({
      ok: true,
      user,
    });

  } catch (e) {
    console.error("AUTH ME ERROR:", e);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

