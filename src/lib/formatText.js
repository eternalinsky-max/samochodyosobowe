// src/lib/formatText.js

// Перетворює \n у <br>
export function convertLineBreaks(text = "") {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\r\n|\r|\n/g, "<br>");
}
