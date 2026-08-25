// Packs every publishable package and installs the tarballs into a throwaway project,
// then imports them the way a consumer would. This catches the class of mistake that
// only shows up after publishing: a wrong `files` list, an `exports` map pointing at a
// file the tarball does not contain, or a `types` field with nothing behind it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PACKAGES = ['core', 'data-adapter', 'react', 'kit', 'standalone'];
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const work = mkdtempSync(join(tmpdir(), 'texo-pack-'));
console.log(`workspace: ${work}\n`);

const tarballs = {};
for (const name of PACKAGES) {
  const out = run('npm', ['pack', '--pack-destination', work], `packages/${name}`).trim();
  const file = out.split('\n').pop().trim();
  tarballs[`@texo-ui/${name}`] = join(work, file);
  console.log(`packed  @texo-ui/${name} -> ${file}`);
}

// A consumer project that installs only the tarballs.
writeFileSync(
  join(work, 'package.json'),
  JSON.stringify(
    {
      name: 'texo-packaging-check',
      private: true,
      type: 'module',
      dependencies: {
        ...Object.fromEntries(Object.entries(tarballs).map(([k, v]) => [k, `file:${v}`])),
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
    },
    null,
    2,
  ),
);

console.log('\ninstalling from tarballs...')
run('npm', ['install', '--no-audit', '--no-fund'], work)

const checks = []
for (const name of PACKAGES) {
  const spec = `@texo-ui/${name}`
  const dir = join(work, 'node_modules', spec)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))

  const typesPath = join(dir, pkg.types ?? '')
  checks.push({ spec, check: 'types file exists', ok: !!pkg.types && existsSync(typesPath) })
  checks.push({ spec, check: 'README shipped', ok: existsSync(join(dir, 'README.md')) })
  checks.push({ spec, check: 'LICENSE shipped', ok: existsSync(join(dir, 'LICENSE')) })
  checks.push({ spec, check: 'version is 0.1.0', ok: pkg.version === '0.1.0' })
  checks.push({ spec, check: 'licence is MIT', ok: pkg.license === 'MIT' })

  for (const [cond, target] of Object.entries(pkg.exports?.['.'] ?? {})) {
    if (typeof target !== 'string') continue
    checks.push({
      spec,
      check: `exports.${cond} resolves (${target})`,
      ok: existsSync(join(dir, target)),
    })
  }

  // standalone is a browser bundle; importing it under Node would need a DOM.
  if (name === 'standalone') continue

  const probe = join(work, `probe-${name}.mjs`)
  writeFileSync(probe, `import * as m from '${spec}';\nconsole.log(Object.keys(m).length);\n`)
  let exportCount = 0
  let ok = true
  try {
    exportCount = Number(run('node', [probe], work).trim())
  } catch (error) {
    ok = false
    checks.push({ spec, check: 'ESM import', ok: false, note: String(error.message).slice(0, 90) })
  }
  if (ok) checks.push({ spec, check: `ESM import (${exportCount} exports)`, ok: exportCount > 0 })
}

let failed = 0
for (const c of checks) {
  if (!c.ok) failed += 1
  console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.spec.padEnd(24)} ${c.check}${c.note ? ' — ' + c.note : ''}`)
}

console.log(`\n${checks.length - failed}/${checks.length} checks passed`)
if (failed) process.exit(1)
