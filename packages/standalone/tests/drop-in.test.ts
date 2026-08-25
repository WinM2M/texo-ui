// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const bundlePath = resolve(process.cwd(), 'packages/standalone/dist/texo.iife.js');

/**
 * Exercises the drop-in bundle the way a plain HTML page does: one <script> tag, then
 * `window.Texo`. Everything below shipped broken to npm at 0.0.1 because nothing tested
 * this path — the bundle threw `process is not defined` before defining the global.
 */
describe('standalone drop-in bundle', () => {
  beforeAll(() => {
    if (!existsSync(bundlePath)) {
      throw new Error(
        `${bundlePath} is missing. Run \`npm run build -w @texo-ui/standalone\` first.`,
      );
    }
    // Indirect eval runs at global scope, so the bundle's top-level `var Texo = ...`
    // becomes a global property exactly as a classic <script> tag would make it. That
    // matters: the IIFE wrapper overwrites the global the entry module assigns, and this
    // test exists to pin down what a page actually ends up with.
    (0, eval)(readFileSync(bundlePath, 'utf8'));
  });

  it('never references process, which does not exist in a browser', () => {
    expect(readFileSync(bundlePath, 'utf8')).not.toContain('process.env.NODE_ENV');
  });

  it('defines the global the README tells people to use', () => {
    const texo = (globalThis as unknown as { Texo?: Record<string, unknown> }).Texo;
    expect(texo).toBeDefined();
    expect(typeof texo?.init).toBe('function');
  });

  it('renders a stream into the host using the built-in primitives', async () => {
    const host = document.createElement('div');
    host.id = 'texo-root';
    document.body.appendChild(host);

    const texo = (globalThis as unknown as {
      Texo: { init: (sel: string) => { stream: (c: string) => void; end: () => void } };
    }).Texo;

    const ui = texo.init('#texo-root');
    ui.stream(':> label\n - text: "hello from cdn"\n\n:> button\n - label: "Click me"\n - action: "go"\n\n');
    ui.end();
    // React schedules the commit; give it a turn before reading the DOM.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const root = host.shadowRoot ?? host;
    expect(root.querySelectorAll('.texo-directive').length).toBeGreaterThanOrEqual(2);
    expect(root.textContent).toContain('hello from cdn');
    expect(root.querySelector('button')?.textContent).toBe('Click me');
  });
});
