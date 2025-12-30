// src/app/terms/page.jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TermsPage() {
  return (
    <main className="prose mx-auto max-w-3xl px-4 py-10">
      <h1>Regulamin serwisu proponujeprace.pl</h1>
      <p>Ostatnia aktualizacja: {new Date().toISOString().slice(0, 10)}</p>

      <h2>1. Postanowienia ogólne</h2>
      <p>
        Niniejszy regulamin określa zasady korzystania z serwisu proponujeprace.pl. Użytkownik,
        rejestrując się lub korzystając z serwisu, akceptuje niniejszy regulamin.
      </p>

      <h2>2. Zakres usług</h2>
      <p>
        Serwis umożliwia publikowanie ofert pracy, przeglądanie ogłoszeń oraz kontakt pomiędzy
        pracodawcami a kandydatami.
      </p>

      <h2>3. Odpowiedzialność</h2>
      <p>
        Administrator nie ponosi odpowiedzialności za treści publikowane przez użytkowników.
        Zastrzegamy prawo do usunięcia treści naruszających prawo lub zasady współżycia społecznego.
      </p>

      <h2>4. Dane osobowe</h2>
      <p>
        Dane osobowe są przetwarzane zgodnie z Polityką prywatności, dostępną na stronie
        <a href="/privacy"> Polityka prywatności</a>.
      </p>

      <h2>5. Postanowienia końcowe</h2>
      <p>
        Administrator zastrzega sobie prawo do zmiany regulaminu. Aktualna wersja jest zawsze
        dostępna na stronie proponujeprace.pl/terms.
      </p>

      <h2>Kontakt</h2>
      <p>E-mail: serwisvans@gmail.com</p>
    </main>
  );
}
