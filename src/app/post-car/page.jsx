// src/app/post-car/page.jsx
import PostCarClient from "./PostCarClient";

export const metadata = {
  title: "Dodaj auto",
};

export default function PostCarPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Dodaj auto</h1>

      <p className="mt-2 text-sm text-gray-600">
        Wypełnij formularz i opublikuj ogłoszenie.
      </p>

      <div className="mt-6">
        <PostCarClient />
      </div>
    </main>
  );
}

