// Copies the built drop-in bundle into docs/ so it is reachable on the web without an
// npm release: GitHub Pages serves docs/, and jsDelivr serves the same file straight from
// the repo. Keeps the map out of git and drops the now-dangling sourceMappingURL comment.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'packages/standalone/dist/texo.iife.js';
const OUT_DIR = 'docs/cdn';
const OUT = `${OUT_DIR}/texo.min.js`;

const code = readFileSync(SOURCE, 'utf8').replace(/\n?\/\/# sourceMappingURL=.*$/m, '\n');
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, code);
copyFileSync('packages/standalone/dist/index.d.ts', `${OUT_DIR}/texo.d.ts`);

const kb = (code.length / 1024).toFixed(1);
console.log(`wrote ${OUT} (${kb} kB)`);
