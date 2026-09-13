import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const markdownFiles = [];

/** Recorre únicamente los documentos y carpetas documentales del proyecto. */
function collectMarkdownFiles(path) {
  if (!existsSync(path)) return;
  const information = statSync(path);
  if (information.isFile()) {
    if (extname(path).toLowerCase() === '.md') markdownFiles.push(path);
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    collectMarkdownFiles(join(path, entry.name));
  }
}

for (const fileName of ['README.md', 'AGENTS.md', 'CURRENT_STATUS.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'THIRD_PARTY_LICENSES.md']) {
  collectMarkdownFiles(join(projectRoot, fileName));
}
for (const folderName of ['doc', 'docs', 'deploy', '.github']) {
  collectMarkdownFiles(join(projectRoot, folderName));
}

const failures = [];
const markdownLinkPattern = /!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\)/g;

for (const markdownFile of markdownFiles) {
  const content = readFileSync(markdownFile, 'utf8');
  for (const match of content.matchAll(markdownLinkPattern)) {
    let destination = match[1].trim().replace(/^<|>$/g, '');
    if (!destination || destination.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|app:)/i.test(destination)) continue;

    destination = destination.split('#', 1)[0].split('?', 1)[0];
    try {
      destination = decodeURIComponent(destination);
    } catch {
      failures.push(`${relative(projectRoot, markdownFile)}: enlace con codificación inválida: ${match[1]}`);
      continue;
    }

    const absoluteDestination = resolve(dirname(markdownFile), destination);
    if (!existsSync(absoluteDestination)) {
      failures.push(`${relative(projectRoot, markdownFile)}: no existe ${destination}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Se encontraron enlaces documentales inválidos:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Documentación verificada: ${markdownFiles.length} archivos Markdown sin enlaces locales rotos.`);
}
