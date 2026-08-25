// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { TexoRenderer } from '@texo-ui/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createBuiltInComponents } from '../src/registry';

const registry = createBuiltInComponents();

afterEach(() => {
  cleanup();
});

function renderStream(content: string): HTMLElement {
  const { container } = render(<TexoRenderer content={content} registry={registry} />);
  return container;
}

describe('theming paints a surface, not just text', () => {
  it('a dark preset sets a background on the root, not only a foreground', () => {
    // Setting the foreground alone leaves light text on whatever the host page is,
    // which rendered dark presets as invisible text.
    const container = renderStream(':> theme\n - preset: "midnight-dark"\n\n:> label\n - text: "hi"\n\n');
    const root = container.querySelector('.texo-root') as HTMLElement;

    expect(root.style.color).toBeTruthy();
    expect(root.style.background).toBeTruthy();
    expect(root.style.getPropertyValue('--texo-theme-background')).toBe('#0b1220');
    expect(root.style.getPropertyValue('--texo-theme-foreground')).toBe('#e2e8f0');
  });

  it('leaves the surface alone when no theme is declared', () => {
    const container = renderStream(':> label\n - text: "hi"\n\n');
    const root = container.querySelector('.texo-root') as HTMLElement;
    expect(root.style.background).toBe('');
  });

  it('every primitive defaults to a dark foreground on an unthemed page', () => {
    // label used to fall back to #e5e7eb, which is invisible on a white page while every
    // other primitive defaulted to a dark colour.
    const container = renderStream(
      ':> label\n - text: "text"\n\n:> input\n - label: "Email"\n - name: "email"\n\n',
    );
    const coloured = [...container.querySelectorAll<HTMLElement>('[style*="--texo-theme-foreground"]')];
    expect(coloured.length).toBeGreaterThan(0);
    for (const el of coloured) {
      expect(el.getAttribute('style')).not.toContain('#e5e7eb');
    }
  });
});

describe('baseline stylesheet', () => {
  it('is injected once into the document head', () => {
    renderStream(':> label\n - text: "one"\n\n');
    renderStream(':> label\n - text: "two"\n\n');
    expect(document.querySelectorAll('#texo-base-styles').length).toBe(1);
  });

  it('drives its colours from theme tokens rather than hardcoded values', () => {
    renderStream(':> label\n - text: "x"\n\n');
    const css = document.querySelector('#texo-base-styles')?.textContent ?? '';
    expect(css).toContain('var(--texo-theme-foreground');
    expect(css).toContain('var(--texo-theme-background');
    expect(css).toContain('var(--texo-theme-line');
    expect(css).not.toMatch(/border:\s*1px solid #e5e7eb/);
  });

  it('can be turned off', () => {
    document.querySelector('#texo-base-styles')?.remove();
    render(<TexoRenderer content={':> label\n - text: "x"\n\n'} registry={registry} injectBaseStyles={false} />);
    expect(document.querySelector('#texo-base-styles')).toBeNull();
  });
});
