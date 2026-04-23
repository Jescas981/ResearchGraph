/**
 * Lee vite.cloudrun.env y escribe public/runtime-config.js (Cloud Run / Docker build).
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envPath = path.join(root, 'vite.cloudrun.env');
const outPath = path.join(root, 'public', 'runtime-config.js');

if (!fs.existsSync(envPath)) {
  console.log('vite.cloudrun.env ausente: se mantiene public/runtime-config.js por defecto.');
  process.exit(0);
}

const text = fs.readFileSync(envPath, 'utf8');
const match = text.match(/^VITE_API_URL=(.+)$/m);
if (!match) {
  console.error('vite.cloudrun.env: se necesita una línea VITE_API_URL=https://...');
  process.exit(1);
}

const url = match[1].trim();
fs.writeFileSync(
  outPath,
  `window.__RG_API_URL__ = ${JSON.stringify(url)};\n`
);
console.log('runtime-config.js generado para build.');
