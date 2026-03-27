// src/app/brands/[make]/[model]/page.jsx
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

function toInt(v) {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function clampPage(n) {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 999) return 999;
  return n;
}

function pln(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(n);
}

function enumLabel(v) {
  if (!v) return "—";
  // Можеш замінити на свої красиві мапи назв
  return String(v)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }) {
  const makeSlug = params?.make;
  const modelSlug = params?.model;

  try {
    const make = await prisma.carMake.findUnique({
      where: { slug: makeSlug },
      select: { id: true, name: true },
    });
    if (!make) return { title: `${makeSlug} ${modelSlug}` };

    const model = await prisma.carModel.findFirst({
      where: { makeId: make.id, slug: modelSlug },
      select: { name: true },
    });
    if (!model) return { title: `${make.name} ${modelSlug}` };

    return {
      title: `${make.name} ${model.name} – wersje i opinie`,
      description: `Sprawdź wersje (trims), dane techniczne i oceny dla ${make.name} ${model.name}.`,
    };
  } catch {
    return { title: `${makeSlug} ${modelSlug}` };
  }
}

export default async function BrandModelPage({ params, searchParams = {} }) {
  const makeSlug = params?.make;
  const modelSlug = params?.model;

  // filters
  const bodyType = (searchParams.bodyType ?? "").toString(); // BodyType enum value
  const fuelType = (searchParams.fuelType ?? "").toString(); // FuelType enum value
  const gearbox = (searchParams.gearbox ?? "").toString(); // GearboxType enum value

  const year = toInt(searchParams.year); // показати trims, які перекривають цей рік
  const minHp = toInt(searchParams.minHp);
  const maxHp = toInt(searchParams.maxHp);

  // pagination
  const page = clampPage(toInt(searchParams.page) ?? 1);
  const take = 24;
  const skip = (page - 1) * take;

  // sort
  // new | price_asc | price_desc | hp_desc | year_desc | rating_desc
  const sort = (searchParams.sort ?? "rating_desc").toString();

  // 1) Make
  const make = await prisma.carMake.findUnique({
    where: { slug: makeSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!make) return notFound();

  // 2) Model (в межах make)
  const model = await prisma.carModel.findFirst({
    where: { makeId: make.id, slug: modelSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!model) return notFound();

  // 3) where для CarTrim
  const whereTrim = {
    modelId: model.id,
    ...(bodyType ? { bodyType } : {}),
    ...(fuelType ? { fuelType } : {}),
    ...(gearbox ? { gearbox } : {}),
    ...(minHp != null || maxHp != null
      ? {
          powerHp: {
            ...(minHp != null ? { gte: minHp } : {}),
            ...(maxHp != null ? { lte: maxHp } : {}),
          },
        }
      : {}),
    ...(year != null
      ? {
          AND: [
            {
              OR: [{ yearFrom: null }, { yearFrom: { lte: year } }],
            },
            {
              OR: [{ yearTo: null }, { yearTo: { gte: year } }],
            },
          ],
        }
      : {}),
  };

  // orderBy (без rating_desc — рейтинг порахуємо JS-ом і відсортуємо після)
  const orderBy =
    sort === "price_asc"
      ? [{ basePricePln: "asc" }, { createdAt: "desc" }]
      : sort === "price_desc"
      ? [{ basePricePln: "desc" }, { createdAt: "desc" }]
      : sort === "hp_desc"
      ? [{ powerHp: "desc" }, { createdAt: "desc" }]
      : sort === "year_desc"
      ? [{ yearFrom: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  // 4) Дані
  // Важливо: щоб показати рейтинг, беремо ratings (тільки value), і comments count
  const [total, trimsRaw] = await Promise.all([
    prisma.carTrim.count({ where: whereTrim }),
    prisma.carTrim.findMany({
      where: whereTrim,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        yearFrom: true,
        yearTo: true,
        bodyType: true,
        fuelType: true,
        gearbox: true,
        powerHp: true,
        engineCc: true,
        rangeKm: true,
        basePricePln: true,
        createdAt: true,
        ratings: { select: { value: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  // 5) Порахувати середній рейтинг
  const trims = trimsRaw.map((t) => {
    const cnt = t.ratings.length;
    const avg =
      cnt === 0 ? null : t.ratings.reduce((s, r) => s + r.value, 0) / cnt;

    return {
      ...t,
      ratingAvg: avg,
      ratingCount: cnt,
      commentsCount: t._count.comments,
    };
  });

  // Якщо sort=rating_desc — досортуємо в JS (для поточної сторінки)
  if (sort === "rating_desc") {
    trims.sort((a, b) => {
      const ar = a.ratingAvg ?? -1;
      const br = b.ratingAvg ?? -1;
      if (br !== ar) return br - ar;
      if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / take));

  // pagination links preserving filters
  const baseQs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v == null || v === "") continue;
    if (k === "page") continue;
    baseQs.set(k, String(v));
  }

  const pageHref = (p) => {
    const q = new URLSearchParams(baseQs);
    q.set("page", String(p));
    const qs = q.toString();
    return qs
      ? `/brands/make/${make.slug}/${model.slug}?${qs}`
      : `/brands/make/${make.slug}/${model.slug}`;
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-5">
        <nav className="text-sm text-gray-600">
          <Link href="/brands" className="hover:underline">
            Marki
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/brands/make/${make.slug}`} className="hover:underline">
            {make.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{model.name}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-semibold">
          {make.name} {model.name}
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Wersje: <span className="font-medium text-gray-900">{total}</span>
        </p>
      </header>

      {trims.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-700">
          Brak wersji dla wybranych filtrów.
          <div className="mt-3">
            <Link
              href={`/brands/make/${make.slug}`}
              className="text-blue-600 hover:underline"
            >
              Zobacz inne modele marki {make.name}
            </Link>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trims.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold leading-tight">
                  {t.name}
                </h2>

                <Link
                  href={`/compare?trim=${t.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Porównaj
                </Link>
              </div>

              <p className="mt-1 text-sm text-gray-600">
                {(t.yearFrom ?? "—") + "–" + (t.yearTo ?? "…")}
                {" · "}
                {enumLabel(t.bodyType)}
              </p>

              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>
                  <span className="text-gray-500">Paliwo:</span>{" "}
                  {enumLabel(t.fuelType)}
                </li>
                <li>
                  <span className="text-gray-500">Skrzynia:</span>{" "}
                  {enumLabel(t.gearbox)}
                </li>
                <li>
                  <span className="text-gray-500">Moc:</span>{" "}
                  {t.powerHp != null ? `${t.powerHp} hp` : "—"}
                  {t.engineCc != null ? ` · ${t.engineCc} cc` : ""}
                  {t.rangeKm != null ? ` · ${t.rangeKm} km` : ""}
                </li>
              </ul>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="text-lg font-semibold">
                  {pln(t.basePricePln)}
                </div>

                <div className="text-right text-xs text-gray-600">
                  <div>
                    Ocena:{" "}
                    <span className="font-medium text-gray-900">
                      {t.ratingAvg == null ? "—" : t.ratingAvg.toFixed(1)}
                    </span>{" "}
                    <span className="text-gray-500">
                      ({t.ratingCount})
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Komentarze: {t.commentsCount}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="mt-8 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Strona <span className="font-medium text-gray-900">{page}</span> z{" "}
          <span className="font-medium text-gray-900">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
            href={pageHref(page - 1)}
          >
            ← Poprzednia
          </Link>

          <Link
            aria-disabled={page >= totalPages}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              page >= totalPages
                ? "pointer-events-none opacity-50"
                : "hover:bg-gray-50"
            }`}
            href={pageHref(page + 1)}
          >
            Następna →
          </Link>
        </div>
      </footer>
    </main>
  );
}
