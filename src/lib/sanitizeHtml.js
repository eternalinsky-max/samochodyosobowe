// src/lib/sanitizeHtml.js

// Явно дозволені теги
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "strong",
  "i",
  "em",
  "br",
  "p",
  "ul",
  "ol",
  "li",
  "pre",   // ← додали
  "code",  // ← додали
]);

// Явно дозволені атрибути
const ALLOWED_ATTRS = new Set(["href", "target", "rel"]);

export function sanitizeHtml(html = "") {
  if (!html || typeof html !== "string") return "";

  // 1. Видаляємо <script>...</script>
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

  // 2. Видаляємо небезпечні теги
  html = html.replace(
    /<\/?(iframe|object|embed|style|link|meta|svg|form|input|button)[^>]*>/gi,
    ""
  );

  // 3. Видаляємо JS-івенти типу onclick, onerror, onload
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  html = html.replace(/\son\w+=\S+/gi, "");

  // 4. Фільтрація тегів та атрибутів
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    tag = tag.toLowerCase();

    // ❌ Заборонений тег → видаляємо
    if (!ALLOWED_TAGS.has(tag)) return "";

    // pre / code атрибути не потрібні — просто повертаємо тег
    if (tag === "pre" || tag === "code") {
      return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
    }

    let safeAttrs = "";

    attrs.replace(/([a-z0-9-]+)=["']([^"']*)["']/gi, (m, name, value) => {
      name = name.toLowerCase();

      if (!ALLOWED_ATTRS.has(name)) return "";

      if (name === "href" && value.trim().toLowerCase().startsWith("javascript:")) {
        return "";
      }

      safeAttrs += ` ${name}="${value}"`;
    });

    return match.startsWith("</")
      ? `</${tag}>`
      : `<${tag}${safeAttrs}>`;
  });
}
