// src/app/api/my-cars/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/my-cars
 * Auth:
 *  - x-id-token: <firebase id token>
 *  - fallback: Authorization: Bearer <token>
 *
 * Query:
 *  - page=1
 *  - perPage=10 (1..50)
 *  - active=1|0 (optional) -> isActive true/false
 *  - city=... (optional)
 *  - make=... (optional)
 *  - model=... (optional)
 */
export async function GET(req) {
  try {
    // 1) token from x-id-token
    let token = req.headers.get("x-id-token") || "";

    // 2) fallback: Bearer
    if (!token) {
      const authHeader = req.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "NO_TOKEN" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (err) {
      console.error("verifyIdToken error in /api/my-cars:", err);
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
    }

    // current user
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    });

    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // query params
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const perPageRaw = Number(url.searchParams.get("perPage") || "10");
    const perPage = Math.min(50, Math.max(1, perPageRaw));

    const active = (url.searchParams.get("active") || "").trim(); // "1" | "0" | ""
    const city = (url.searchParams.get("city") || "").trim();
    const make = (url.searchParams.get("make") || "").trim();
    const model = (url.searchParams.get("model") || "").trim();

    // IMPORTANT: your schema uses userId (not ownerId)
    const where = {
      userId: me.id,
      ...(active === "1" ? { isActive: true } : {}),
      ...(active === "0" ? { isActive: false } : {}),
      ...(city
        ? {
            city: { contains: city, mode: "insensitive" },
          }
        : {}),
      ...(make
        ? {
            make: { contains: make, mode: "insensitive" },
          }
        : {}),
      ...(model
        ? {
            model: { contains: model, mode: "insensitive" },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.carListing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage + 1,
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
          isActive: true,
          createdAt: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      }),
      prisma.carListing.count({ where }),
    ]);

    const hasNext = items.length > perPage;
    const sliced = hasNext ? items.slice(0, perPage) : items;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({
      items: sliced.map((c) => ({
        id: c.id,
        title: c.title,
        make: c.make,
        model: c.model,
        year: c.year,
        mileageKm: c.mileageKm,
        pricePln: c.pricePln,
        fuelType: c.fuelType,
        gearbox: c.gearbox,
        bodyType: c.bodyType,
        city: c.city,
        isActive: c.isActive,
        createdAt: c.createdAt,
        coverUrl: c.images?.[0]?.url || null,
      })),
      total,
      totalPages,
      hasNext,
    });
  } catch (e) {
    console.error("GET /api/my-cars error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
