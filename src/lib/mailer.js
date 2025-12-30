// src/lib/mailer.js
import 'server-only';
import { sendMail as smtpSend, verifySmtp } from '@/lib/email.js';

const RESEND_KEY = process.env.RESEND_API_KEY || null;

function safeStr(v) {
  if (v == null) return '';
  return String(v);
}

export async function sendMail({ to, replyTo, subject, text, html, fromName }) {
  if (!to) throw new Error('No recipient');

  // 1) Try Resend
  if (RESEND_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName || 'proponujeprace.pl'} <onboarding@resend.dev>`,
          to,
          subject,
          html,
          text,
          reply_to: replyTo,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend error ${res.status}: ${body}`);
      }

      const data = await res.json().catch(() => null);
      return { id: data?.id ?? null, provider: 'resend' };
    } catch (err) {
      console.error('sendMail(resend) failed:', err);
    }
  }

  // 2) Try SMTP
  try {
    const ok = await verifySmtp();
    if (ok && ok.ok) {
      const info = await smtpSend({
        to,
        subject: safeStr(subject),
        text: safeStr(text),
        html: safeStr(html),
      });

      return { id: info?.messageId ?? null, provider: 'smtp' };
    } else {
      console.warn('SMTP verify failed:', ok);
    }
  } catch (err) {
    console.error('SMTP error:', err);
  }

  // 3) Fallback
  console.warn('MAIL FALLBACK (no SMTP/Resend configured)');
  console.log({
    to,
    subject,
    text,
    html,
  });

  return { id: null, provider: 'fallback' };
}
