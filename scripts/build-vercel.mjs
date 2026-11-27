// Skrip build untuk Vercel: menyalin file statis ke dist/ dan menyuntikkan Environment Variables ke dist/js/config.js.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'dist');

function readOptionalDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const values = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) {
      continue;
    }
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    values[key] = val;
  }
  return values;
}

const localEnv = readOptionalDotEnv(path.join(rootDir, '.env'));
const getEnv = (name) => (process.env[name] ?? localEnv[name] ?? '').trim();

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Salin seluruh halaman HTML dan folder runtime (css, js, assets).
for (const entry of fs.readdirSync(rootDir)) {
  if (entry.endsWith('.html')) {
    fs.copyFileSync(path.join(rootDir, entry), path.join(outDir, entry));
  }
}

for (const folder of ['css', 'js', 'assets']) {
  const srcFolder = path.join(rootDir, folder);
  if (fs.existsSync(srcFolder)) {
    fs.cpSync(srcFolder, path.join(outDir, folder), { recursive: true });
  }
}

const templatePath = path.join(rootDir, 'js', 'config.example.js');
if (!fs.existsSync(templatePath)) {
  throw new Error('Template js/config.example.js tidak ditemukan.');
}

// Bangun dist/js/config.js selalu dari template bersih agar kredensial lokal tidak ikut bocor jika env kosong.
let configSource = fs.readFileSync(templatePath, 'utf8');
const rawAdminEmails = getEnv('ADMIN_EMAILS');
const allowedEmailHashes = rawAdminEmails
  ? rawAdminEmails
      .split(/[\s,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .map((email) => crypto.createHash('sha256').update(email, 'utf8').digest('hex'))
  : [];

const replacements = {
  calendarId: getEnv('GCAL_CALENDAR_ID'),
  apiKey: getEnv('GCAL_API_KEY'),
  oauthClientId: getEnv('GCAL_OAUTH_CLIENT_ID')
};

for (const [field, value] of Object.entries(replacements)) {
  const pattern = new RegExp(`(${field}:\\s*)'[^']*'`);
  configSource = configSource.replace(pattern, () => `${field}: ${JSON.stringify(value)}`);
}

configSource = configSource.replace(
  /allowedEmailHashes:\s*\[\s*\]/,
  () => `allowedEmailHashes: ${JSON.stringify(allowedEmailHashes)}`
);

fs.writeFileSync(path.join(outDir, 'js', 'config.js'), configSource, 'utf8');
fs.rmSync(path.join(outDir, 'js', 'config.example.js'), { force: true });

console.log('Vercel build selesai: dist/ siap dideploy.');
