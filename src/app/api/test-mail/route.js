// src/app/api/test-mail/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { sendMail, verifySmtp } from '@/lib/email';

export async function GET() {
  try {
    // спершу покажемо діагностику підключення (без паролів)
    const diag = await verifySmtp();

    if (!diag.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: 'verify',
          hint: 'Sprawdź EMAIL_USER (musi być zweryfikowany w Brevo), EMAIL_PASS (SMTP key), port/secure.',
          diag,
          env: {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            user: process.env.EMAIL_USER,
            from: process.env.EMAIL_FROM,
          },
        },
        { status: 500 },
      );
    }

    // якщо верифікація пройшла — пробуємо відправити
    const info = await sendMail({
      to: process.env.EMAIL_USER, // пошли сам собі
      subject: '✅ Test Brevo SMTP',
      text: 'Działa! — Wiadomość testowa z proponujeprace.pl 💙',
    });

    return NextResponse.json({ ok: true, messageId: info?.messageId || null });
  } catch (e) {
    console.error('SMTP send error:', e);
    return NextResponse.json(
      {
        ok: false,
        step: 'send',
        error: e?.message || String(e),
        meta: e?.meta || null,
      },
      { status: 500 },
    );
  }
}
