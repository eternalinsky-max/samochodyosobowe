import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function requireFirebaseUid(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(m[1]);
    return decoded?.uid || null;
  } catch {
    return null;
  }
}

function safeExtFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

export async function POST(req, { params }) {
  const firebaseUid = await requireFirebaseUid(req);
  if (!firebaseUid) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const listingId = params.id;

  // user з БД
  const dbUser = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });
  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 401 });
  }

  // перевірити власника
  const listing = await prisma.carListing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true },
  });
  if (!listing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (listing.userId !== dbUser.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter(Boolean);

  if (!files.length) {
    return NextResponse.json({ ok: false, error: "No files" }, { status: 400 });
  }
  if (files.length > 10) {
    return NextResponse.json({ ok: false, error: "Too many files (max 10)" }, { status: 400 });
  }

  // папка: public/uploads/car-listings/{id}
  const relDir = path.join("uploads", "car-listings", listingId);
  const absDir = path.join(process.cwd(), "public", relDir);
  await fs.mkdir(absDir, { recursive: true });

  // sortOrder продовжуємо
  const last = await prisma.carListingImage.findFirst({
    where: { listingId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let sortOrder = (last?.sortOrder ?? -1) + 1;

  const created = [];

  for (const f of files) {
    if (typeof f === "string") continue;

    const ext = safeExtFromMime(f.type || "");
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "Only jpg/png/webp allowed" },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await f.arrayBuffer());

    // ліміт 6MB на файл
    if (buf.length > 6 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File too large (max 6MB)" }, { status: 400 });
    }

    const name = crypto.randomBytes(16).toString("hex") + "." + ext;
    const absPath = path.join(absDir, name);
    await fs.writeFile(absPath, buf);

    const url = "/" + path.join(relDir, name).replaceAll("\\", "/");

    const img = await prisma.carListingImage.create({
      data: {
        listingId,
        url,
        path: absPath,
        sortOrder: sortOrder++,
      },
      select: { id: true, url: true, sortOrder: true },
    });

    created.push(img);
  }

  return NextResponse.json({ ok: true, images: created });
}
