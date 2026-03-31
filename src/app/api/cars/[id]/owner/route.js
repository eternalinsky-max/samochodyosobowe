import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUser(req) {
  let token = req.headers.get("x-id-token") || "";

  if (!token) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
  }

  if (!token) {
    return { error: NextResponse.json({ error: "NO_TOKEN" }, { status: 401 }) };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, firebaseUid: true },
    });

    if (!user) {
      return { error: NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 }) };
    }

    return { user };
  } catch (err) {
    console.error("verifyIdToken error:", err);
    return { error: NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 }) };
  }
}

// ✅ GET — перевірити власника
export async function GET(req, { params }) {
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    const user = auth.user;
    const car = await prisma.carListing.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, isActive: true },
    });

    if (!car) return NextResponse.json({ error: "CAR_NOT_FOUND" }, { status: 404 });

    const isOwner = car.userId === user.id;

    return NextResponse.json({ isOwner, isActive: car.isActive });
  } catch (e) {
    console.error("GET /api/cars/[id]/owner error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

// ✅ POST — призначити або перевірити власника
export async function POST(req, { params }) {
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    const user = auth.user;
    const carId = params.id;

    const car = await prisma.carListing.findUnique({
      where: { id: carId },
      select: { id: true, userId: true },
    });

    if (!car)
      return NextResponse.json({ error: "CAR_NOT_FOUND" }, { status: 404 });

    // якщо авто ще без власника або інший uid — оновити
    if (!car.userId || car.userId !== user.id) {
      await prisma.carListing.update({
        where: { id: carId },
        data: { userId: user.id },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/cars/[id]/owner error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
