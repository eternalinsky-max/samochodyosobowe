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
    // ✅ FIX AUTH (без auth.ok)
    const decoded = await verifyIdTokenFromRequest(req);
    const firebaseUid = decoded.uid;

    const body = await req.json().catch(() => ({}));

    const title = String(body.title || "").trim();
    const make = String(body.make || "").trim();
    const model = String(body.model || "").trim();

    // ✅ дозволяємо draft (OLX-style)
    const safeTitle = title || "Nowe ogłoszenie";
    const safeMake = make || "BMW";
    const safeModel = model || "X5";

    // 👤 user
    const dbUser = await prisma.user.upsert({
      where: { firebaseUid },
      update: {},
      create: {
        firebaseUid,
        email: body.email ? String(body.email) : null,
        displayName: body.displayName ? String(body.displayName) : null,
        photoUrl: body.photoUrl ? String(body.photoUrl) : null,
        phone: body.phone ? String(body.phone) : null,
      },
      select: { id: true },
    });

    // 🚗 create car
    const car = await prisma.carListing.create({
      data: {
        user: {
          connect: { id: dbUser.id },
        },

        title: safeTitle,
        description: body.description ? String(body.description) : null,

        make: safeMake,
        model: safeModel,

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

    return NextResponse.json(
      {
        ok: true,
        id: car.id, // 🔥 важливо для фронта
        car,
      },
      { status: 201 }
    );
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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 20);

    const where = {
      isActive: true,
      ...(q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { make: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const items = await prisma.carListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        make: true,
        model: true,
        year: true,
        mileageKm: true,
        pricePln: true,
        fuelType: true,
        gearbox: true,
        bodyType: true,
        city: true,
        images: {
          take: 1,
          orderBy: { sortOrder: 'asc' },
          select: { url: true },
        },
      },
    });

    const result = items.map((c) => ({
      ...c,
      coverUrl: c.images?.[0]?.url || null,
      images: undefined,
    }));

    return NextResponse.json({ items: result });
  } catch (error) {
    console.error('GET /api/cars ERROR:', error);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}