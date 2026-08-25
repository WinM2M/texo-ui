// Applies the release-shape fields to every publishable package: version, licence,
// provenance metadata, and internal dependency ranges. Internal ranges have to move with
// the version — publishing 0.1.0 while standalone still asks for @texo-ui/kit@^0.0.1
// produces a package that cannot be installed.
import { readFileSync, writeFileSync } from 'node:fs';

const VERSION = '0.1.0';
const REPO = 'https://github.com/WinM2M/texo-ui';

const PACKAGES = ['core', 'react', 'kit', 'standalone', 'data-adapter'];

const KEYWORDS = {
  core: ['llm', 'streaming', 'parser', 'generative-ui', 'markdown', 'ast', 'texo'],
  react: ['llm', 'generative-ui', 'react', 'streaming', 'renderer', 'texo'],
  kit: ['llm', 'generative-ui', 'react', 'components', 'design-system', 'texo'],
  standalone: ['llm', 'generative-ui', 'cdn', 'no-build', 'widget', 'texo'],
  'data-adapter': ['byos', 'storage', 'google-drive', 'notion', 'localstorage', 'texo'],
};

const DESCRIPTIONS = {
  core: 'Stream-first parser that turns LLM text into a UI tree. Platform independent.',
  react: 'React renderer for Texo: reconciles a streaming UI tree into your components.',
  kit: 'The built-in Texo component vocabulary, plus the catalog that teaches it to an LLM.',
  standalone:
    'Texo in one script tag. Self-contained bundle for CDN and no-build pages.',
  'data-adapter': 'Bring-your-own-storage drivers for Texo: local, Google Drive, Notion, HTTP.',
};

for (const name of PACKAGES) {
  const path = `packages/${name}/package.json`;
  const pkg = JSON.parse(readFileSync(path, 'utf8'));

  pkg.version = VERSION;
  pkg.description = DESCRIPTIONS[name];
  pkg.license = 'MIT';
  pkg.author = 'Youngjune Kwon';
  pkg.keywords = KEYWORDS[name];
  pkg.homepage = `${REPO}#readme`;
  pkg.bugs = { url: `${REPO}/issues` };
  pkg.repository = {
    type: 'git',
    url: `git+${REPO}.git`,
    directory: `packages/${name}`,
  };

  // Never publish a stale dist.
  pkg.scripts = { ...pkg.scripts, prepublishOnly: 'npm run build' };

  // Internal ranges follow the version.
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const dep of Object.keys(deps)) {
      if (dep.startsWith('@texo-ui/')) deps[dep] = `^${VERSION}`;
    }
  }

  // The standalone build inlines React and every @texo-ui package, so the published
  // artifact has no runtime dependencies at all. Declaring them would make consumers
  // download a second copy of React they never load.
  if (name === 'standalone') {
    pkg.devDependencies = { ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) };
    delete pkg.dependencies;
  }

  // Key order that reads well on npm.
  const head = ['name', 'version', 'description', 'keywords', 'license', 'author',
    'homepage', 'bugs', 'repository', 'type', 'main', 'module', 'browser', 'types',
    'unpkg', 'jsdelivr', 'exports', 'files', 'sideEffects'];
  const ordered = {};
  for (const k of head) if (k in pkg) ordered[k] = pkg[k];
  for (const k of Object.keys(pkg)) if (!(k in ordered)) ordered[k] = pkg[k];

  writeFileSync(path, JSON.stringify(ordered, null, 2) + '\n');
  console.log(`${pkg.name} -> ${VERSION}`);
}
