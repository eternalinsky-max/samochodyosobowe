import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyIdTokenFromRequest } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function toInt(v) {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  try {
    const auth = await verifyIdTokenFromRequest(req);

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: auth.error || "Unauthorized" },
        { status: auth.status || 401 }
      );
    }

    const firebaseUid = auth.decoded.uid;

    const body = await req.json().catch(() => ({}));

    const title = String(body.title || "").trim();
    const make = String(body.make || "").trim();
    const model = String(body.model || "").trim();

    if (!title || !make || !model) {
      return NextResponse.json(
        { ok: false, error: "title, make, model are required" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.upsert({
      where: { firebaseUid },
      update: {
        email: body.email ? String(body.email) : undefined,
        displayName: body.displayName ? String(body.displayName) : undefined,
        photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
        phone: body.phone ? String(body.phone) : undefined,
      },
      create: {
        firebaseUid,
        email: body.email ? String(body.email) : null,
        displayName: body.displayName ? String(body.displayName) : null,
        photoUrl: body.photoUrl ? String(body.photoUrl) : null,
        phone: body.phone ? String(body.phone) : null,
      },
      select: { id: true, firebaseUid: true },
    });

    const car = await prisma.carListing.create({
      data: {
        user: {
          connect: { id: dbUser.id },
        },

        title,
        description: body.description ? String(body.description) : null,

        make,
        model,
        year: toInt(body.year),
        mileageKm: toInt(body.mileageKm),
        pricePln: toInt(body.pricePln),

        fuelType: body.fuelType || null,
        gearbox: body.gearbox || null,
        bodyType: body.bodyType || null,

        city: body.city ? String(body.city) : null,
        phone: body.phone ? String(body.phone) : null,

        isActive: body.isActive !== false,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        make: true,
        model: true,
        year: true,
        pricePln: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, car }, { status: 201 });

  } catch (error) {
    console.error("POST /api/cars ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "SERVER_ERROR",
        message: error.message,
      },
      { status: 500 }
    );
  }
}