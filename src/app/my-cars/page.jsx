// src/app/my-cars/page.jsx
import MyCarsClient from "./MyCarsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moje ogłoszenia – SamochodyOsobowe.pl",
};

export default function MyCarsPage() {
  return (
    <main className="min-h-[70vh] bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">
            PANEL UŻYTKOWNIKA
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Moje ogłoszenia
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Tutaj zarządzasz swoimi ogłoszeniami samochodów.
          </p>
        </div>

        <MyCarsClient />
      </div>
    </main>
  );
}
