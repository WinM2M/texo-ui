import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  // Library mode does not substitute NODE_ENV the way an app build does, so the bundled
  // React would reference `process` and throw on load in a plain browser page.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    // `Texo.version` is the only thing a CDN consumer can inspect to find out what they
    // actually loaded. Read it from package.json at build time so it cannot drift from
    // the artifact it is stamped on.
    __TEXO_VERSION__: JSON.stringify(version),
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Texo',
      fileName: 'texo',
      formats: ['iife', 'umd'],
    },
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist',
  },
});
