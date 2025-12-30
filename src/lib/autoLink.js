// src/lib/autoLink.js
import { sanitizeHtml } from "./sanitizeHtml";
import { convertLineBreaks } from "./formatText";
import { applyMarkdown } from "./markdown";

// Робимо лінки, не чіпаючи вже існуючий HTML
function linkify(text = "") {
  // Ділимо текст, зберігаючи пробіли як окремі "токени"
  const parts = text.split(/(\s+)/);

  return parts
    .map((part) => {
      if (!part) return "";
      // Якщо це тільки пробіли — повертаємо як є
      if (/^\s+$/.test(part)) return part;

      // Якщо шматок вже містить <...> — це HTML, не чіпаємо
      if (part.includes("<")) return part;

      // 1) http / https
      if (/^(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)$/i.test(part)) {
        const url = part;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      }

      // 2) www.example.com
      if (/^(www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)$/i.test(part)) {
        const url = "https://" + part;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${part}</a>`;
      }

      // 3) example.com / youtube.com/watch?v=123
      if (/^([\w-]+\.[a-z]{2,})(\/[^\s]*)?$/i.test(part)) {
        const url = "https://" + part;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${part}</a>`;
      }

      // Інакше повертаємо як є
      return part;
    })
    .join("");
}

export function autoLink(text = "") {
  if (!text || typeof text !== "string") return text;

  let processed = text;

  // 1. Markdown (**жирний**, *курсив*, списки)
  processed = applyMarkdown(processed);

  // 2. Автолінки (http, www, домени)
  processed = linkify(processed);

  // 3. Переноси рядків
  processed = convertLineBreaks(processed);

  // 4. XSS-захист (білий список тегів)
  return sanitizeHtml(processed);
}
