// src/lib/markdown.js

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInline(text = "") {
  if (!text || typeof text !== "string") return text;

  let result = text;

  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  // **жирний**
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // *курсив*
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return result;
}

export function applyMarkdown(text = "") {
  if (!text || typeof text !== "string") return text;

  const lines = text.split(/\r?\n/);
  const out = [];

  let currentListType = null; // 'ul' | 'ol'
  let inCodeBlock = false;
  let codeBuffer = [];

  const closeList = () => {
    if (currentListType === "ul") out.push("</ul>");
    if (currentListType === "ol") out.push("</ol>");
    currentListType = null;
  };

  for (let rawLine of lines) {
    const line = rawLine.trimEnd();

    // -------- CODE BLOCK START / END --------
    if (line.trim() === "```") {
      if (!inCodeBlock) {
        // відкриваємо блок
        inCodeBlock = true;
        closeList();
        codeBuffer = [];
      } else {
        // закриваємо блок
        inCodeBlock = false;
        const codeHtml = "<pre><code>" + escapeHtml(codeBuffer.join("\n")) + "</code></pre>";
        out.push(codeHtml);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine); // не трогаємо форматування
      continue;
    }

    // ---------- CODE BLOCK START / END ----------
if (line.trim().startsWith("```")) {
  const fence = line.trim(); // ``` або ```js
  if (!inCodeBlock) {
    // Відкриваємо блок
    inCodeBlock = true;
    closeList();
    codeBuffer = [];
  } else {
    // Закриваємо блок
    inCodeBlock = false;
    const codeHtml =
      "<pre><code>" + escapeHtml(codeBuffer.join("\n")) + "</code></pre>";
    out.push(codeHtml);
  }
  continue;
}


    // -------- ЗАГОЛОВКИ H1–H6 --------
    let m;

    m = line.match(/^######\s+(.+)$/);
    if (m) {
      closeList();
      out.push(`<h6>${formatInline(m[1])}</h6>`);
      continue;
    }

    m = line.match(/^#####\s+(.+)$/);
    if (m) {
      closeList();
      out.push(`<h5>${formatInline(m[1])}</h5>`);
      continue;
    }

    m = line.match(/^####\s+(.+)$/);
    if (m) {
      closeList();
      out.push(`<h4>${formatInline(m[1])}</h4>`);
      continue;
    }

    m = line.match(/^###\s+(.+)$/);
    if (m) {
      closeList();
      out.push(`<h3>${formatInline(m[1])}</h3>`);
      continue;
    }

    m = line.match(/^##\s+(.+)$/);
    if (m) {
      closeList();
      out.push(`<h2>${formatInline(m[1])}</h2>`);
      continue;
    }

    m = line.match(/^#\s+(.+)$/);
    if (m) {
      closeList();
      out.push(`<h1>${formatInline(m[1])}</h1>`);
      continue;
    }

    // -------- Маркований список --------
    m = line.match(/^[-*]\s+(.+)$/);
    if (m) {
      if (currentListType !== "ul") {
        closeList();
        currentListType = "ul";
        out.push("<ul>");
      }
      out.push(`<li>${formatInline(m[1])}</li>`);
      continue;
    }

    // -------- Нумерований список --------
    m = line.match(/^\d+\.\s+(.+)$/);
    if (m) {
      if (currentListType !== "ol") {
        closeList();
        currentListType = "ol";
        out.push("<ol>");
      }
      out.push(`<li>${formatInline(m[1])}</li>`);
      continue;
    }

    // -------- Звичайний текст --------
    closeList();
    out.push(formatInline(line));
  }

  closeList();

  return out.join("\n");
}
