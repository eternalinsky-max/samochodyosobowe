// src/lib/templates.js
export function baseHtml({ title, body }) {
  return `<!doctype html>
<html>
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body {
      background: #f6f7fb;
      margin: 0;
      padding: 24px;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      color: #111;
    }
    .card {
      max-width: 640px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 24px;
    }
    .btn {
      display: inline-block;
      background: #377ff9;
      color: #fff !important;
      text-decoration: none;
      border-radius: 8px;
      padding: 10px 16px;
    }
    .muted {
      color: #667085;
      font-size: 12px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <div class="muted">© proponujeprace.pl</div>
  </div>
</body>
</html>`;
}
