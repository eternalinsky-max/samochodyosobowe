import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const idToken = String(body?.idToken || "").trim();
    if (!idToken) return NextResponse.json({ error: "ID_TOKEN_REQUIRED" }, { status: 400 });

    // Тривалість сесії (наприклад 7 днів)
    const expiresIn = 7 * 24 * 60 * 60 * 1000;

    // Перевіряємо токен
    await adminAuth.verifyIdToken(idToken);

    // Створюємо session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });

    res.cookies.set({
      name: "__session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return res;
  } catch (e) {
    console.error("POST /api/auth/session error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "__session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}