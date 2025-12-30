// src/lib/email.js
import 'server-only';

import nodemailer from 'nodemailer';

function bool(v, def = false) {
  if (v == null) return def;
  const s = String(v).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(s);
}

const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';
const from = process.env.EMAIL_FROM || user;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // 465 = SSL, 587 = STARTTLS
  auth: { user, pass },
  connectionTimeout: 20_000, // 20 секунд на встановлення з'єднання
  greetingTimeout: 10_000, // 10 секунд очікування вітання від сервера
  socketTimeout: 30_000, // 30 секунд загальний таймаут з'єднання
  // Логування та відладка
  logger: bool(process.env.EMAIL_DEBUG, false),
  debug: bool(process.env.EMAIL_DEBUG, false),
  tls: {
    rejectUnauthorized: true, // у продакшені краще true для безпеки
  },
  // обмеження розміру повідомлення (напр. 10 МБ)
  maxMessageSize: 10 * 1024 * 1024,
});

export async function verifySmtp() {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || String(err),
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
    };
  }
}

export async function sendMail({ to, subject, text, html }) {
  const v = await verifySmtp();
  if (!v.ok) {
    const e = new Error(v.error || 'SMTP verify failed');
    e.meta = v;
    throw e;
  }
  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
