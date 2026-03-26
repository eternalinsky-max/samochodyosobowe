import Link from "next/link";

export default function PremiumHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hero.jpg')",
        }}
      />

      {/* LIGHT gradient (не вбиває картинку) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-xl text-white">
          <p className="text-sm tracking-[0.25em] text-white/70">
            SAUTOM PLATFORM
          </p>

          <h1 className="mt-4 text-5xl font-light leading-tight sm:text-6xl">
            Znajdź swoje idealne auto.
          </h1>

          <p className="mt-6 text-lg text-white/80">
            Nowoczesna platforma do wyszukiwania, porównywania i publikowania ogłoszeń motoryzacyjnych.
          </p>

          <div className="mt-10 flex gap-4">
            <Link
              href="/cars"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-7 py-4 text-sm font-medium text-white hover:bg-blue-500 transition"
            >
              Przeglądaj auta
            </Link>

            <Link
              href="/post-car"
              className="inline-flex items-center justify-center rounded-md border border-white/30 px-7 py-4 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              Dodaj ogłoszenie
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}