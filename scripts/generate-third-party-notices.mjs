import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Conserva los avisos de los paquetes distribuidos. Leemos la instalación
// exacta del lockfile; no descargamos ni ejecutamos código de terceros aquí.
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const sections = ['SmartBI — Third-party notices',
  'The application is MIT licensed. Dependencies retain their original licenses.',
  'This file includes installed production dependencies, including build tools.'];
let count = 0;
const seen = new Set();
for (const [location, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
  if (!location || entry.dev) continue;
  const packageFile = path.join(location, 'package.json');
  if (!existsSync(packageFile)) continue; // Paquete opcional de otro sistema operativo.
  const metadata = JSON.parse(readFileSync(packageFile, 'utf8'));
  const identity = `${metadata.name}@${metadata.version}`;
  if (seen.has(identity)) continue;
  seen.add(identity);
  const licenseFiles = readdirSync(location).filter((name) => /^(?:licen[cs]e|copying|notice)(?:\..*)?$/i.test(name)).sort();
  const notices = licenseFiles.map((name) => `${name}\n${readFileSync(path.join(location, name), 'utf8').trim()}`);
  const repository = typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url;
  sections.push(`\n${'='.repeat(72)}\n${identity}\nLicense: ${metadata.license || entry.license || 'See upstream'}\n${repository || metadata.homepage || ''}\n\n${notices.join('\n\n') || 'See the upstream package for the complete license text.'}`);
  count += 1;
}
writeFileSync('public/THIRD_PARTY_NOTICES.txt', `${sections.join('\n').replace(/[ \t]+$/gm, '')}\n`, 'utf8');
console.log(`Avisos conservados para ${count} paquetes de producción instalados.`);
