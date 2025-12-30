// src/app/api/contact/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { limitByKey } from "@/lib/rateLimit"; // якщо Upstash не налаштований — функція пропустить

const bodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional(), // honeypot
  startedAt: z.number().optional(), // time-trap
  termsAccepted: z.boolean().optional(), // checkbox
});

const MIN_TIME_MS = 5000; // min 5s
const MAX_TIME_MS = 1000 * 60 * 60 * 2; // max 2h

function getClientIp(req) {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  return `${h.get("user-agent") || "ua"}|${h.get("accept-language") || "lang"}`;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function logContact({
  ip,
  userAgent,
  name,
  email,
  message,
  spam = false,
  rateLimited = false,
  success = false,
  provider = null,
  providerMessageId = null,
  error = null,
  retryAfterSec = null,
}) {
  try {
    await prisma.contactMessageLog.create({
      data: {
        ip: ip?.slice(0, 255) || "unknown",
        userAgent: userAgent?.slice(0, 1000) || null,
        name: String(name || "").slice(0, 200),
        email: String(email || "").slice(0, 320),
        message: String(message || "").slice(0, 5000),
        messageLen: Number(String(message || "").length),
        spam: !!spam,
        rateLimited: !!rateLimited,
        success: !!success,
        provider,
        providerMessageId,
        error: error ? String(error).slice(0, 1000) : null,
        retryAfterSec: retryAfterSec ?? null,
      },
    });
  } catch (e) {
    // лог падіння логування, але не зриваємо основний флоу
    console.error("contact log error:", e);
  }
}

export async function POST(req) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "";
  const now = Date.now();

  try {
    // 1) Rate limit (Upstash). Якщо не налаштовано — success=true і пропуск
    const rate = await limitByKey(`ip:${ip}`);
    if (!rate.success) {
      const retrySec = Math.max(1, Math.ceil((rate.reset - now) / 1000));

      await logContact({
        ip,
        userAgent: ua,
        name: "(rate-limited)",
        email: "",
        message: "",
        rateLimited: true,
        success: false,
        retryAfterSec: retrySec,
      });

      const res = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
      res.headers.set("Retry-After", String(retrySec));
      res.headers.set("X-RateLimit-Limit", String(rate.limit));
      res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
      res.headers.set("X-RateLimit-Reset", String(rate.reset));
      return res;
    }

    // 2) Validate
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const res = NextResponse.json(
        { error: "Bad request", issues: parsed.error.flatten() },
        { status: 400 },
      );
      if (rate.limit != null) {
        res.headers.set("X-RateLimit-Limit", String(rate.limit));
        res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
        res.headers.set("X-RateLimit-Reset", String(rate.reset));
      }
      return res;
    }

    const { name, email, message, website, startedAt, termsAccepted } = parsed.data;

    // 3) Honeypot
    if (website && website.trim() !== "") {
      await logContact({
        ip,
        userAgent: ua,
        name,
        email,
        message,
        spam: true,
        success: false,
      });

      const res = NextResponse.json({ ok: true, spam: true }, { status: 200 });
      if (rate.limit != null) {
        res.headers.set("X-RateLimit-Limit", String(rate.limit));
        res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
        res.headers.set("X-RateLimit-Reset", String(rate.reset));
      }
      return res;
    }

    // 4) Time-trap
    if (typeof startedAt === "number") {
      const delta = now - startedAt;

      if (delta < MIN_TIME_MS) {
        await logContact({
          ip,
          userAgent: ua,
          name,
          email,
          message,
          success: false,
          error: "Too fast",
        });

        const res = NextResponse.json({ error: "Too fast" }, { status: 429 });
        res.headers.set("Retry-After", "5");
        if (rate.limit != null) {
          res.headers.set("X-RateLimit-Limit", String(rate.limit));
          res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
          res.headers.set("X-RateLimit-Reset", String(rate.reset));
        }
        return res;
      }

      if (delta > MAX_TIME_MS) {
        await logContact({
          ip,
          userAgent: ua,
          name,
          email,
          message,
          success: false,
          error: "Form expired",
        });

        const res = NextResponse.json({ error: "Form expired" }, { status: 400 });
        if (rate.limit != null) {
          res.headers.set("X-RateLimit-Limit", String(rate.limit));
          res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
          res.headers.set("X-RateLimit-Reset", String(rate.reset));
        }
        return res;
      }
    }

    // 5) (optional) terms
    if (termsAccepted !== undefined && termsAccepted !== true) {
      await logContact({
        ip,
        userAgent: ua,
        name,
        email,
        message,
        success: false,
        error: "Terms must be accepted",
      });

      const res = NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
      if (rate.limit != null) {
        res.headers.set("X-RateLimit-Limit", String(rate.limit));
        res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
        res.headers.set("X-RateLimit-Reset", String(rate.reset));
      }
      return res;
    }

    // 6) Compose & send
    const to = process.env.SUPPORT_EMAIL || "serwisvans@gmail.com";
    const subject = `Kontakt z proponujeprace.pl — ${name}`;
    const text = `Imię i nazwisko: ${name}
Email: ${email}
IP: ${ip}

Treść wiadomości:
${message}`;

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <p><strong>Imię i nazwisko:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>IP:</strong> ${escapeHtml(ip)}</p>
        <p><strong>Treść wiadomości:</strong></p>
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
      </div>
    `;

    let result = null;
    let mailError = null;

    try {
      result = await sendMail({
        to,
        replyTo: email,
        subject,
        text,
        html,
        fromName: "Formularz kontaktowy",
      });
    } catch (err) {
      console.error("sendMail error:", err);
      mailError = err;
    }

    await logContact({
      ip,
      userAgent: ua,
      name,
      email,
      message,
      success: !mailError,
      provider: result?.provider || null,
      providerMessageId: result?.id || null,
      error: mailError ? String(mailError?.message || mailError) : null,
    });

    // Якщо пошта не відправилась — все одно не валимо форму 500-кою
    const res = NextResponse.json(
      mailError
        ? { ok: false, message: "Wiadomość zapisana, ale nie udało się wysłać e-maila." }
        : { ok: true },
      { status: 200 },
    );

    if (rate.limit != null) {
      res.headers.set("X-RateLimit-Limit", String(rate.limit));
      res.headers.set("X-RateLimit-Remaining", String(rate.remaining));
      res.headers.set("X-RateLimit-Reset", String(rate.reset));
    }
    return res;
  } catch (e) {
    console.error("POST /api/contact error:", e);
    try {
      // намагаємось залогувати помилку теж
      await logContact({
        ip,
        userAgent: ua,
        name: "(exception)",
        email: "",
        message: "",
        success: false,
        error: e?.message || "Server error",
      });
    } catch (logErr) {
      // залишаємо без ескалації, щоб не затирати основну помилку
      console.error("logContact failed:", logErr);
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
