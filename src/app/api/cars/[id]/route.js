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

// ✅ PATCH — оновлення оголошення
export async function PATCH(req, { params }) {
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    const user = auth.user;
    const carId = params.id;

    const car = await prisma.carListing.findUnique({
      where: { id: carId },
      select: { id: true, userId: true },
    });

    if (!car) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (car.userId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const payload = await req.json();

    const updated = await prisma.carListing.update({
      where: { id: carId },
      data: {
        title: payload.title ?? car.title,
        description: payload.description ?? car.description,
        make: payload.make ?? car.make,
        model: payload.model ?? car.model,
        year: payload.year ?? car.year,
        pricePln: payload.pricePln ?? car.pricePln,
        fuelType: payload.fuelType ?? car.fuelType,
        gearbox: payload.gearbox ?? car.gearbox,
        bodyType: payload.bodyType ?? car.bodyType,
        // додай інші поля, які хочеш оновлювати
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        make: true,
        model: true,
        year: true,
        pricePln: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/cars/[id] error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
