"use client";

import { useEffect, useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    termsAccepted: false,
  });

  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => setStartedAt(Date.now()), []);

  useEffect(() => {
    if (ok || err) {
      const timer = setTimeout(() => {
        setOk(false);
        setErr("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [ok, err]);

  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setOk(false);
    setErr("");

    const hp = (e.currentTarget.website?.value || "").trim();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          website: hp,
          startedAt,
          termsAccepted: form.termsAccepted,
        }),
      });

      if (res.status === 429) {
        const retry = res.headers.get("Retry-After");
        throw new Error(
          retry
            ? `Zbyt wiele prób. Spróbuj ponownie za ${retry} s.`
            : "Zbyt wiele prób. Spróbuj ponownie później."
        );
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setOk(true);
      setForm({
        name: "",
        email: "",
        message: "",
        termsAccepted: false,
      });
      setStartedAt(Date.now());
    } catch (e2) {
      setErr(e2.message || "Wystąpił błąd");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
          Skontaktuj się z nami
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          Jeśli masz pytania, sugestie lub chcesz zgłosić problem z portalem —
          napisz do nas. Odpowiemy najszybciej jak to możliwe.
        </p>
      </div>

      {ok && (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          Dziękujemy! Wiadomość została wysłana.
        </div>
      )}

      {err && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Błąd: {err}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="surface grid gap-5 rounded-3xl p-5 sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Imię i nazwisko
            </label>
            <input
              id="name"
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3"
              placeholder="Twoje imię i nazwisko"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Adres e-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3"
              placeholder="np. jan.kowalski@gmail.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Treść wiadomości
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={7}
            minLength={10}
            maxLength={5000}
            value={form.message}
            onChange={handleChange}
            className="w-full resize-y px-4 py-3"
            placeholder="Napisz swoją wiadomość..."
          />
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4">
          <input
            id="termsAccepted"
            type="checkbox"
            name="termsAccepted"
            checked={form.termsAccepted}
            onChange={handleChange}
            required
            className="mt-1 h-4 w-4 shrink-0"
          />
          <label
            htmlFor="termsAccepted"
            className="text-sm leading-6 text-slate-300"
          >
            Wyrażam zgodę na kontakt w sprawie mojego zapytania.
          </label>
        </div>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <button
          type="submit"
          disabled={sending}
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Wysyłanie…" : "Wyślij wiadomość"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Lub napisz bezpośrednio:{" "}
        <a
          href="mailto:serwisvans@gmail.com"
          className="font-semibold text-sky-400 transition hover:text-sky-300 hover:underline"
        >
          serwisvans@gmail.com
        </a>
      </p>

      <section className="surface mt-8 rounded-3xl p-6 text-sm leading-7 text-slate-300">
        <p className="mb-2 text-base font-bold text-slate-100">
          VANS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ
        </p>
        <p>NIP: 7011068577</p>
        <p>KRS: 0000945541</p>
        <p>Kapitał zakładowy: 5 000,00 zł</p>
        <p>Adres: UL. STANISŁAWA WOJCIECHOWSKIEGO 33 / 7, 02-495 WARSZAWA</p>
      </section>

      <div className="surface mt-4 overflow-hidden rounded-3xl">
        <iframe
          title="Mapa — VANS Sp. z o.o."
          src={
            "https://www.google.com/maps?q=" +
            encodeURIComponent(
              "UL. STANISŁAWA WOJCIECHOWSKIEGO 33, 02-495 WARSZAWA"
            ) +
            "&output=embed"
          }
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-72 w-full border-0"
        />
      </div>
    </main>
  );
}