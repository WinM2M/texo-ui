import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (pkg: string): string =>
  fileURLToPath(new URL(`./packages/${pkg}/src`, import.meta.url));

export default defineConfig({
  resolve: {
    // Run tests against source, not built dist, so the suite does not depend on build order.
    alias: {
      '@texo-ui/core': src('core'),
      '@texo-ui/react': src('react'),
      '@texo-ui/kit': src('kit'),
      '@texo-ui/data-adapter': src('data-adapter'),
    },
  },
  test: {
    passWithNoTests: true,
    include: ['packages/**/*.test.{ts,tsx}', 'examples/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-types/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/**/src/**/*.{ts,tsx}'],
      exclude: ['packages/**/src/**/*.test.{ts,tsx}', 'packages/**/src/**/index.ts'],
      // Ratchet: these are the levels the suite actually holds today, enforced in CI so
      // coverage can only go up. Raise them when you add tests; never lower them.
      thresholds: {
        lines: 69,
        functions: 69,
        branches: 73,
        statements: 69,
        // The parser is the component everything else depends on, so it carries the
        // 80% bar the project guidelines call for.
        'packages/core/src/parser/**': {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    },
  },
});
