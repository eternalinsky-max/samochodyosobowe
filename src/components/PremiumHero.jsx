import Link from "next/link";

export default function PremiumHero() {
  return (
    <section className="relative min-h-[100vh] w-full overflow-hidden bg-black">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero.jpg')" }}
      />

      {/* Left overlay like BMW */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/0" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100vh] max-w-6xl items-center px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-xl text-white">
          <p className="text-sm tracking-[0.25em] text-white/80">NEUE KLASSE</p>

          <h1 className="mt-4 text-5xl font-light leading-tight sm:text-6xl">
            WKROCZ W NOWĄ ERĘ.
          </h1>

          <div className="mt-10">
            <Link
              href="/cars"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-7 py-4 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              Poznaj katalog
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}