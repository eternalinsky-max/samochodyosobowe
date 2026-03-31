// src/app/api/cars/[id]/images/route.js
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

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err) {
    console.error("verifyIdToken error in /api/cars/[id]/images:", err);
    return { error: NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 }) };
  }

  const me = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    select: { id: true },
  });

  if (!me) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  return { me };
}

// GET: list images for listing (owner only)
export async function GET(req, { params }) {
  try {
    const { me, error } = await requireUser(req);
    if (error) return error;

    const carId = params.id;

    const car = await prisma.carListing.findUnique({
      where: { id: carId },
      select: { id: true, userId: true },
    });

    if (!car) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (car.userId !== me.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const images = await prisma.carListingImage.findMany({
      where: { listingId: carId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, url: true, sortOrder: true, createdAt: true },
    });

    return NextResponse.json({ items: images });
  } catch (e) {
    console.error("GET /api/cars/[id]/images error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: add image by URL (owner only)
export async function POST(req, { params }) {
  try {
    const { me, error } = await requireUser(req);
    if (error) return error;

    const carId = params.id;

    const car = await prisma.carListing.findUnique({
      where: { id: carId },
      select: { id: true, userId: true },
    });

    if (!car) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (car.userId !== me.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const url = String(body?.url || "").trim();

    if (!url) return NextResponse.json({ error: "URL_REQUIRED" }, { status: 400 });
    if (!/^https?:\/\/.+/i.test(url)) {
      return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
    }

    // next sortOrder
    const last = await prisma.carListingImage.findFirst({
      where: { listingId: carId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const sortOrder = (last?.sortOrder ?? 0) + 1;

    const created = await prisma.carListingImage.create({
      data: {
        listingId: carId,
        url,
        sortOrder,
      },
      select: { id: true, url: true, sortOrder: true, createdAt: true },
    });

    return NextResponse.json({ item: created });
  } catch (e) {
    console.error("POST /api/cars/[id]/images error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE: remove image by id (owner only)
export async function DELETE(req, { params }) {
  try {
    const { me, error } = await requireUser(req);
    if (error) return error;

    const carId = params.id;

    const url = new URL(req.url);
    const imageId = String(url.searchParams.get("imageId") || "").trim();
    if (!imageId) return NextResponse.json({ error: "IMAGE_ID_REQUIRED" }, { status: 400 });

    const car = await prisma.carListing.findUnique({
      where: { id: carId },
      select: { id: true, userId: true },
    });

    if (!car) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (car.userId !== me.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    // ensure image belongs to this listing
    const img = await prisma.carListingImage.findUnique({
      where: { id: imageId },
      select: { id: true, listingId: true },
    });

    if (!img || img.listingId !== carId) {
      return NextResponse.json({ error: "IMAGE_NOT_FOUND" }, { status: 404 });
    }

    await prisma.carListingImage.delete({ where: { id: imageId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/cars/[id]/images error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
