// src/lib/formatDescription.js
import { sanitizeHtml } from "./sanitizeHtml";

const urlRegex = /\b((https?:\/\/|www\.)[^\s<]+)/gi;

export function formatDescription(raw = "") {
  if (!raw || typeof raw !== "string") return "";

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  let html;

  if (!looksLikeHtml) {
    // 1) Екрануємо спецсимволи
    let escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2) Автолінкуємо URL
    escaped = escaped.replace(urlRegex, (match) => {
      let href = match;
      if (!/^https?:\/\//i.test(href)) {
        href = "https://" + href;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });

    // 3) Переноси рядків
    html = escaped.replace(/\r\n|\n|\r/g, "<br />");
  } else {
    // Користувач вже написав HTML (наприклад <a href="...">)
    html = raw;
  }

  return sanitizeHtml(html);
}
