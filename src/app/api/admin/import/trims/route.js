import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/validators"; // або зроби простий slugify тут
import { requireAdmin } from "@/lib/auth";  // під свою авторизацію

function makeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toInt(v) {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  // 1) auth
  // якщо в тебе інша авторизація — підстав свою
  await requireAdmin(req);

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ ok: false, error: "No items" }, { status: 400 });
  }

  // 2) обробка батчами (щоб не вбити БД)
  const BATCH = 200;
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    // Транзакція на батч
    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        try {
          const makeName = String(row.make || "").trim();
          const modelName = String(row.model || "").trim();
          const trimName = String(row.trim || "").trim();
          if (!makeName || !modelName || !trimName) {
            errors++;
            continue;
          }

          const makeSlugVal = makeSlug(makeName);
          const modelSlugVal = makeSlug(modelName);

          // Make upsert
          const make = await tx.carMake.upsert({
            where: { slug: makeSlugVal },
            create: { name: makeName, slug: makeSlugVal },
            update: { name: makeName },
            select: { id: true },
          });

          // Model upsert (unique makeId+slug)
          const model = await tx.carModel.upsert({
            where: { makeId_slug: { makeId: make.id, slug: modelSlugVal } },
            create: { makeId: make.id, name: modelName, slug: modelSlugVal },
            update: { name: modelName },
            select: { id: true },
          });

          // Trim: тут варіанти
          // Якщо додаси @@unique([modelId,name]) — можна так:
          const existing = await tx.carTrim.findFirst({
            where: { modelId: model.id, name: trimName },
            select: { id: true },
          });

          const data = {
            modelId: model.id,
            name: trimName,
            yearFrom: toInt(row.yearFrom),
            yearTo: toInt(row.yearTo),
            bodyType: row.bodyType || null,
            fuelType: row.fuelType || null,
            gearbox: row.gearbox || null,
            powerHp: toInt(row.powerHp),
            engineCc: toInt(row.engineCc),
            rangeKm: toInt(row.rangeKm),
            basePricePln: toInt(row.basePricePln),
          };

          if (!existing) {
            await tx.carTrim.create({ data });
            created++;
          } else {
            await tx.carTrim.update({
              where: { id: existing.id },
              data,
            });
            updated++;
          }
        } catch (e) {
          errors++;
        }
      }
    });
  }

  return NextResponse.json({
    ok: true,
    total: items.length,
    created,
    updated,
    errors,
  });
}
