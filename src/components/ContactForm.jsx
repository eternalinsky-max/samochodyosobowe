// src/components/ContactForm.jsx
"use client";

import { useEffect, useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot (приховане поле)
  const [startedAt, setStartedAt] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Записуємо час, коли форма вперше відрендерилась
  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        website: website || "",      // honeypot — лишаємо порожнім
        startedAt: startedAt ?? Date.now(), // число, не строка!
        termsAccepted: true,         // явно boolean
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // в разі 400 тут буде { error: "Bad request", issues: ... }
        console.error("Contact error:", data);
        if (data.error === "Too fast") {
          setError("Formularz został wysłany zbyt szybko. Spróbuj ponownie za kilka sekund.");
        } else if (data.error === "Form expired") {
          setError("Formularz wygasł. Odśwież stronę i spróbuj ponownie.");
        } else if (data.error === "Terms must be accepted") {
          setError("Musisz zaakceptować zgodę na kontakt.");
        } else {
          setError(data.error || "Wystąpił błąd podczas wysyłania wiadomości.");
        }
        return;
      }

      // Успіх
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
      setWebsite("");
      setStartedAt(Date.now());
    } catch (err) {
      console.error("Contact submit failed:", err);
      setError("Wystąpił błąd sieci. Spróbuj ponownie później.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Twoja wiadomość została wysłana.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Imię i nazwisko
        </label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Adres e-mail
        </label>
        <input
          type="email"
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Treść wiadomości
        </label>
        <textarea
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
        />
      </div>

      {/* honeypot — сховай цей input через CSS (display:none) */}
      <div style={{ display: "none" }}>
        <label>
          Strona internetowa
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="terms"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-brand-600"
          defaultChecked
          disabled
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          Wyrażam zgodę na kontakt w sprawie mojego zapytania.
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? "Wysyłanie..." : "Wyślij wiadomość"}
      </button>
    </form>
  );
}
