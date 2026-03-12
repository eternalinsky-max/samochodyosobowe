// src/app/brands/[make]/page.jsx
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

function enumLabel(v) {
  if (!v) return "—";
  return String(v)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }) {
  const makeSlug = params?.make;

  try {
    const make = await prisma.carMake.findUnique({
      where: { slug: makeSlug },
      select: { name: true },
    });

    if (!make) return { title: makeSlug };

    return {
      title: `${make.name} – modele, wersje i opinie`,
      description: `Zobacz listę modeli marki ${make.name}. Przeglądaj wersje (trims), dane techniczne, oceny i komentarze.`,
    };
  } catch {
    return { title: makeSlug };
  }
}

export default async function BrandPage({ params, searchParams = {} }) {
  const makeSlug = params?.make;

  // optional filters for "latest trims"
  const fuelType = (searchParams.fuelType ?? "").toString();
  const gearbox = (searchParams.gearbox ?? "").toString();
  const bodyType = (searchParams.bodyType ?? "").toString();

  // pagination for trims list (optional section)
  const page = clampPage(toInt(searchParams.page) ?? 1);
  const take = 18;
  const skip = (page - 1) * take;

  // 1) find make
  const make = await prisma.carMake.findUnique({
    where: { slug: makeSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!make) return notFound();

  // 2) models of this make
  const models = await prisma.carModel.findMany({
    where: { makeId: make.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { trims: true } },
    },
  });

  // 3) "latest / popular trims" section (optional but useful)
  const whereTrim = {
    model: { makeId: make.id },
    ...(fuelType ? { fuelType } : {}),
    ...(gearbox ? { gearbox } : {}),
    ...(bodyType ? { bodyType } : {}),
  };

  const [totalTrims, trimsRaw] = await Promise.all([
    prisma.carTrim.count({ where: whereTrim }),
    prisma.carTrim.findMany({
      where: whereTrim,
      orderBy: [{ createdAt: "desc" }],
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
        model: { select: { slug: true, name: true } },
        ratings: { select: { value: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

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

  const totalPages = Math.max(1, Math.ceil(totalTrims / take));

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
    return qs ? `/brands/${make.slug}?${qs}` : `/brands/${make.slug}`;
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-6">
        <nav className="text-sm text-gray-600">
          <Link href="/brands" className="hover:underline">
            Marki
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{make.name}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-semibold">{make.name}</h1>

        <p className="mt-1 text-sm text-gray-600">
          Modele:{" "}
          <span className="font-medium text-gray-900">{models.length}</span>
        </p>
      </header>

      {/* MODELS GRID */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Modele</h2>

        {models.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-gray-700">
            Brak modeli dla tej marki.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m) => (
              <Link
                key={m.id}
                href={`/brands/${make.slug}/${m.slug}`}
                className="rounded-xl border bg-white p-4 shadow-sm hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-base font-semibold">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    trims: {m._count.trims}
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Zobacz wersje i opinie →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* LATEST TRIMS */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Najnowsze wersje (trims)</h2>
          <div className="text-sm text-gray-600">
            Razem:{" "}
            <span className="font-medium text-gray-900">{totalTrims}</span>
          </div>
        </div>

        {trims.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-gray-700">
            Brak wersji dla wybranych filtrów.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trims.map((t) => (
              <article
                key={t.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-600">
                      {make.name} · {t.model.name}
                    </div>
                    <h3 className="text-base font-semibold leading-tight">
                      {t.name}
                    </h3>
                  </div>

                  <Link
                    href={`/brands/${make.slug}/${t.model.slug}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Model →
                  </Link>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  {(t.yearFrom ?? "—") + "–" + (t.yearTo ?? "…")}
                  {" · "}
                  {enumLabel(t.bodyType)}
                </p>

                <div className="mt-3 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Paliwo:</span>{" "}
                    {enumLabel(t.fuelType)}
                  </div>
                  <div>
                    <span className="text-gray-500">Skrzynia:</span>{" "}
                    {enumLabel(t.gearbox)}
                  </div>
                  <div>
                    <span className="text-gray-500">Moc:</span>{" "}
                    {t.powerHp != null ? `${t.powerHp} hp` : "—"}
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    Ocena:{" "}
                    <span className="font-medium text-gray-900">
                      {t.ratingAvg == null ? "—" : t.ratingAvg.toFixed(1)}
                    </span>{" "}
                    <span className="text-gray-500">({t.ratingCount})</span>
                    <div className="text-gray-500">
                      Komentarze: {t.commentsCount}
                    </div>
                  </div>

                  <Link
                    href={`/brands/${make.slug}/${t.model.slug}?trim=${t.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Wersje →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination for trims */}
        <footer className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            Strona{" "}
            <span className="font-medium text-gray-900">{page}</span> z{" "}
            <span className="font-medium text-gray-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              aria-disabled={page <= 1}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                page <= 1
                  ? "pointer-events-none opacity-50"
                  : "hover:bg-gray-50"
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
      </section>
    </main>
  );
}
