import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";
import CarOwnerActions from "@/components/CarOwnerActions";

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

  switch (String(v)) {
    case "PETROL":
      return "Benzyna";
    case "DIESEL":
      return "Diesel";
    case "HYBRID":
      return "Hybryda";
    case "PHEV":
      return "PHEV";
    case "ELECTRIC":
      return "Elektryczny";
    case "LPG":
      return "LPG";
    case "CNG":
      return "CNG";
    case "MANUAL":
      return "Manual";
    case "AUTOMATIC":
      return "Automat";
    case "HATCHBACK":
      return "Hatchback";
    case "SEDAN":
      return "Sedan";
    case "WAGON":
      return "Kombi";
    case "SUV":
      return "SUV";
    case "COUPE":
      return "Coupe";
    case "CONVERTIBLE":
      return "Kabriolet";
    case "VAN":
      return "Van";
    case "PICKUP":
      return "Pickup";
    default:
      return String(v)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
  }
}

async function getServerUserId() {
  const session = cookies().get("__session")?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    });
    return me?.id || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const car = await prisma.carListing.findUnique({
    where: { id: params.id },
    select: { title: true, make: true, model: true },
  });

  return {
    title: car?.title || `${car?.make || "Auto"} ${car?.model || ""}`.trim() || "Auto",
  };
}

function SpecCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

export default async function CarDetailsPage({ params }) {
  const car = await prisma.carListing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!car) return notFound();

  const cover = car.images?.[0]?.url || "/images/Bmw.jpg";

  const serverUserId = await getServerUserId();
  const isOwner = !!serverUserId && car.userId === serverUserId;

  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <img
          src={cover}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: "center center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-black/35" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <Link
          href="/cars"
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
        >
          ← Wróć do listy
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 text-sm tracking-[0.28em] text-white/60">
              OGŁOSZENIE
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {car.title}
            </h1>

            <div className="mt-3 text-sm text-white/70">
              {car.make} {car.model}
              {car.year ? ` · ${car.year}` : ""}
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="relative h-[300px] overflow-hidden sm:h-[380px] lg:h-[500px]">
                <img
                  src={cover}
                  alt={car.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                  {pln(car.pricePln)}
                </div>
              </div>

              {car.images?.length > 1 ? (
                <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6 lg:grid-cols-7">
                  {car.images.slice(0, 14).map((img) => (
                    <div
                      key={img.id}
                      className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-16 w-full object-cover sm:h-20"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="h-fit rounded-[28px] border border-white/10 bg-black/45 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold text-white">
                  {pln(car.pricePln)}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  {car.make} {car.model}
                </div>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  car.isActive
                    ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    : "border border-white/10 bg-white/5 text-white/60"
                }`}
              >
                {car.isActive ? "Aktywne" : "Nieaktywne"}
              </div>
            </div>

            {isOwner ? (
              <div className="mt-4">
                <CarOwnerActions carId={car.id} isActive={car.isActive} />
              </div>
            ) : null}

            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <SpecCard label="Nadwozie" value={enumLabel(car.bodyType)} />
              <SpecCard label="Paliwo" value={enumLabel(car.fuelType)} />
              <SpecCard label="Skrzynia" value={enumLabel(car.gearbox)} />
              <SpecCard label="Miasto" value={car.city || "—"} />
              <SpecCard label="Rok" value={car.year || "—"} />
              <SpecCard
                label="Przebieg"
                value={
                  car.mileageKm != null
                    ? `${car.mileageKm.toLocaleString("pl-PL")} km`
                    : "—"
                }
              />
            </dl>

            {(car.phone || car.city) && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                <div className="text-sm font-medium text-white">Kontakt</div>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  {car.phone ? (
                    <div>
                      Telefon: <span className="font-medium text-white">{car.phone}</span>
                    </div>
                  ) : null}
                  {car.city ? (
                    <div>
                      Lokalizacja:{" "}
                      <span className="font-medium text-white">{car.city}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {car.description ? (
          <section className="mt-8 rounded-[28px] border border-white/10 bg-black/45 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="text-lg font-semibold text-white">Opis</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
              {car.description}
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}