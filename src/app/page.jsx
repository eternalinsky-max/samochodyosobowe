import PremiumHero from '@/components/PremiumHero';
export const dynamic = "force-dynamic";
export default function HomePage() {
  return (
    <>
      <PremiumHero />
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-center text-2xl font-light text-neutral-900">
            Już dziś poczuj przedsmak mobilności jutra.
          </p>
        </div>
      </section>
    </>
  );
}


