import { defineConfig } from 'vite';

export default defineConfig({
  // Library mode does not substitute NODE_ENV the way an app build does, so the bundled
  // React would reference `process` and throw on load in a plain browser page.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
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
