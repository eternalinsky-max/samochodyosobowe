import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Мінімальний захист:
 * - або перевірка адміна (підключиш свою auth-логіку)
 * - або API key
 */
function requireApiKey(req) {
  const key = req.headers.get("x-api-key");
  if (!process.env.IMPORT_API_KEY) return; // якщо не задано — пропускаємо (dev)
  if (key !== process.env.IMPORT_API_KEY) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
}

function slugify(s) {
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

function cleanEnum(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export async function POST(req) {
  try {
    requireApiKey(req);

    const body = await req.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ ok: false, error: "No items" }, { status: 400 });
    }

    const BATCH = 200;

    let createdMakes = 0;
    let createdModels = 0;
    let createdTrims = 0;
    let updatedTrims = 0;
    let errors = 0;

    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);

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

            const makeSlug = slugify(makeName);
            const modelSlug = slugify(modelName);

            // 1) Make upsert by slug (slug unique)
            const makeBefore = await tx.carMake.findUnique({
              where: { slug: makeSlug },
              select: { id: true },
            });

            const make = await tx.carMake.upsert({
              where: { slug: makeSlug },
              create: { name: makeName, slug: makeSlug },
              update: { name: makeName },
              select: { id: true },
            });

            if (!makeBefore) createdMakes++;

            // 2) Model upsert by compound unique (makeId + slug)
            // Prisma генерує поле where: { makeId_slug: { makeId, slug } } для @@unique([makeId, slug])
            const modelBefore = await tx.carModel.findUnique({
              where: { makeId_slug: { makeId: make.id, slug: modelSlug } },
              select: { id: true },
            });

            const model = await tx.carModel.upsert({
              where: { makeId_slug: { makeId: make.id, slug: modelSlug } },
              create: { makeId: make.id, name: modelName, slug: modelSlug },
              update: { name: modelName },
              select: { id: true },
            });

            if (!modelBefore) createdModels++;

            // 3) Trim update/create
            // У тебе немає @@unique для trim, тому робимо "soft-upsert" по (modelId + name)
            const existingTrim = await tx.carTrim.findFirst({
              where: { modelId: model.id, name: trimName },
              select: { id: true },
            });

            const data = {
              modelId: model.id,
              name: trimName,
              yearFrom: toInt(row.yearFrom),
              yearTo: toInt(row.yearTo),
              bodyType: cleanEnum(row.bodyType),
              fuelType: cleanEnum(row.fuelType),
              gearbox: cleanEnum(row.gearbox),
              powerHp: toInt(row.powerHp),
              engineCc: toInt(row.engineCc),
              rangeKm: toInt(row.rangeKm),
              basePricePln: toInt(row.basePricePln),
            };

            if (!existingTrim) {
              await tx.carTrim.create({ data });
              createdTrims++;
            } else {
              await tx.carTrim.update({
                where: { id: existingTrim.id },
                data,
              });
              updatedTrims++;
            }
          } catch {
            errors++;
          }
        }
      });
    }

    return NextResponse.json({
      ok: true,
      total: items.length,
      createdMakes,
      createdModels,
      createdTrims,
      updatedTrims,
      errors,
    });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status }
    );
  }
}
