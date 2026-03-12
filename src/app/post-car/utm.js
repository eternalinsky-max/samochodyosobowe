// src/lib/utm.js
export function parseUtmFromUrl(url = '') {
  try {
    const u = new URL(url);
    const p = u.searchParams;
    const utm = {
      source: p.get('utm_source') || null,
      medium: p.get('utm_medium') || null,
      campaign: p.get('utm_campaign') || null,
      term: p.get('utm_term') || null,
      content: p.get('utm_content') || null,
    };
    // прибрати пусті
    Object.keys(utm).forEach((k) => utm[k] == null && delete utm[k]);
    return utm;
  } catch {
    return {};
  }
}

const KEY = 'utm_params_v1';

export function saveUtm(utm) {
  if (!utm || Object.keys(utm).length === 0) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(utm));
  } catch {}
}

export function loadUtm() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

/** Зберігаємо перше джерело, не перезаписуємо якщо вже є */
export function captureUtmOnceFromLocation() {
  if (typeof window === 'undefined') return;
  const existing = loadUtm();
  if (existing && Object.keys(existing).length > 0) return;
  const utm = parseUtmFromUrl(window.location.href);
  if (Object.keys(utm).length > 0) saveUtm(utm);
}
