import Link from "next/link";

export default function PremiumHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: "url('/images/hero.jpg')",
        }}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

      {/* Extra bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-xl text-white">

          <p className="text-xs tracking-[0.35em] text-white/50">
            SAUTOM PLATFORM
          </p>

          <h1 className="mt-5 text-5xl font-light leading-tight sm:text-6xl">
            Znajdź swoje
            <br />
            idealne auto.
          </h1>

          <p className="mt-6 text-lg text-white/75">
            Nowoczesna platforma do wyszukiwania, porównywania i publikowania ogłoszeń motoryzacyjnych.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/cars"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white shadow-lg hover:bg-blue-500 transition"
            >
              Przeglądaj auta
            </Link>

            <Link
              href="/post-car"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-4 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              Dodaj ogłoszenie
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

