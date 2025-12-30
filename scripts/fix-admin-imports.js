// scripts/fix-admin-imports.js (CommonJS, ASCII-only)
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('src', 'app', 'api', 'admin');
const TARGET_IMPORT = "@/lib/firebase-admin";
const OLD_PATTERNS = [
  "@/lib/firebase-admin-init",
  "@/lib/initFirebaseAdmin",
  "@/lib/firebaseAdminInit",
  "@/lib/firebase-admin-old"
];

function walk(dir) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of list) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out = out.concat(walk(full));
    } else if (e.isFile() && /^route\.(js|ts)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function replaceImports(src) {
  let s = src;

  // Replace named imports that include initFirebaseAdmin from known modules
  for (const old of OLD_PATTERNS) {
    const rx = new RegExp(
      String.raw`import\s+\{[^}]*\binitFirebaseAdmin\b[^}]*\}\s+from\s+['"]${old}['"]\s*;?`,
      'g'
    );
    s = s.replace(rx, `import { adminAuth } from '${TARGET_IMPORT}';`);
  }

  // Replace namespace imports like: import * as X from 'old'; X.initFirebaseAdmin(...)
  for (const old of OLD_PATTERNS) {
    const nsRx = new RegExp(
      String.raw`import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]${old}['"]\s*;?`,
      'g'
    );
    s = s.replace(nsRx, `import { adminAuth } from '${TARGET_IMPORT}';`);
    const callNsRx = new RegExp(String.raw`\b[A-Za-z_$][\w$]*\.initFirebaseAdmin\s*\([^)]*\)\s*;?`, 'g');
    s = s.replace(callNsRx, '');
  }

  // Remove bare calls: initFirebaseAdmin(...)
  s = s.replace(/\binitFirebaseAdmin\s*\([^)]*\)\s*;?/g, '');

  return s;
}

function processFile(filePath) {
  const orig = fs.readFileSync(filePath, 'utf8');
  const replaced = replaceImports(orig);
  if (replaced !== orig) {
    fs.copyFileSync(filePath, filePath + '.bak');
    fs.writeFileSync(filePath, replaced, 'utf8');
    console.log('✅ Updated:', path.relative(process.cwd(), filePath));
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('❌ No admin API directory:', ROOT);
    process.exit(1);
  }
  const files = walk(ROOT);
  if (files.length === 0) {
    console.warn('⚠️ No route.js/ts files found under', ROOT);
    return;
  }
  for (const f of files) processFile(f);
  console.log('\n✨ Done! Replaced imports with "@/lib/firebase-admin".');
}

main();
