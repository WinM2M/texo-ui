// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TexoRenderer, type TexoAction } from '@texo-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuiltInComponents } from '../src/registry';

const registry = createBuiltInComponents();

afterEach(() => {
  cleanup();
});

function renderStream(content: string, onAction?: (action: TexoAction) => void): void {
  render(<TexoRenderer content={content} registry={registry} onAction={onAction} />);
}

describe('kit primitives render through the real parse -> AST -> reconcile path', () => {
  it('label renders its text', () => {
    renderStream(':> label\n - text: "Last sync: 2 minutes ago"\n');
    expect(screen.getByText('Last sync: 2 minutes ago')).toBeTruthy();
  });

  it('button renders its label and dispatches the declared action on click', () => {
    const onAction = vi.fn();
    renderStream(':> button\n - label: "Save"\n - action: "save-form"\n', onAction);

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0]).toMatchObject({
      type: 'save-form',
      directive: 'button',
    });
  });

  it('input renders a labelled field', () => {
    renderStream(':> input\n - label: "Email"\n - name: "email"\n - inputType: "email"\n');
    expect(screen.getByText('Email')).toBeTruthy();
    expect(document.querySelector('input[type="email"]')).toBeTruthy();
  });

  it('checkbox renders a checkbox input', () => {
    renderStream(':> checkbox\n - label: "Subscribe"\n - action: "toggle-subscribe"\n');
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('table renders headers and cell values', () => {
    renderStream(
      ':> table\n - columns: ["name", "value"]\n - rows: [{"name":"CPU","value":42}]\n',
    );
    expect(screen.getByText('name')).toBeTruthy();
    expect(screen.getByText('CPU')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('stack renders its title', () => {
    renderStream(':> stack\n - direction: "column"\n - gap: 12\n - title: "Profile"\n');
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('grid renders its title', () => {
    renderStream(':> grid\n - id: "overview"\n - rows: 1\n - columns: 2\n - title: "Overview"\n');
    expect(screen.getByText('Overview')).toBeTruthy();
  });

  it('chart renders a series name', () => {
    renderStream(
      ':> chart\n - chartType: "line"\n - labels: ["1", "2", "3"]\n - series: [{"name":"Sales","values":[12,18,16]}]\n',
    );
    expect(screen.getAllByText('Sales').length).toBeGreaterThan(0);
  });

  it('rect renders an svg image', () => {
    renderStream(':> rect 200x30 #00ff00\n');
    expect(screen.getByRole('img', { name: 'Rectangle' })).toBeTruthy();
  });

  it('svg renders an svg image', () => {
    renderStream(':> svg 120x40\n - background: "#eeeeee"\n');
    expect(screen.getByRole('img', { name: 'SVG' })).toBeTruthy();
  });
});

describe('content primitives', () => {
  it('text renders prose as a paragraph by default', () => {
    renderStream(':> text\n - text: "Three planets are retrograde."\n');
    const node = screen.getByText('Three planets are retrograde.');
    expect(node.tagName).toBe('P');
  });

  it('text maps each variant onto its heading level', () => {
    renderStream(':> text\n - text: "Natal chart"\n - variant: "h2"\n');
    expect(screen.getByText('Natal chart').tagName).toBe('H2');
  });

  it('text falls back to body copy when the variant is not one we document', () => {
    renderStream(':> text\n - text: "unknown variant"\n - variant: "display"\n');
    expect(screen.getByText('unknown variant').tagName).toBe('P');
  });

  it('text renders inline bold, italic and code', () => {
    renderStream(
      ':> text\n - text: "A **bold** and *soft* `token` line."\n',
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('soft').tagName).toBe('EM');
    expect(screen.getByText('token').tagName).toBe('CODE');
  });

  it('card renders its title, body and footer', () => {
    renderStream(
      ':> card\n - title: "Natal chart"\n - text: "Sun in Aries."\n - footer: "Updated today"\n',
    );
    expect(screen.getByText('Natal chart').tagName).toBe('H3');
    expect(screen.getByText('Sun in Aries.')).toBeTruthy();
    expect(screen.getByText('Updated today')).toBeTruthy();
  });

  it('card renders nothing when it carries no copy', () => {
    renderStream(':> card\n - variant: "elevated"\n');
    expect(document.querySelector('.texo-directive--card section')).toBeNull();
  });

  it('divider renders a rule, and a labelled divider shows its caption', () => {
    renderStream(':> divider\n');
    expect(document.querySelector('hr')).toBeTruthy();

    cleanup();
    renderStream(':> divider\n - label: "Today"\n');
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByRole('separator')).toBeTruthy();
  });

  it('image renders a captioned image from an https source', () => {
    renderStream(
      ':> image\n - src: "https://example.com/wheel.png"\n - alt: "Natal wheel"\n - caption: "Generated today"\n',
    );
    const img = screen.getByRole('img', { name: 'Natal wheel' }) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://example.com/wheel.png');
    expect(screen.getByText('Generated today')).toBeTruthy();
  });

  it.each([
    ['javascript:alert(1)'],
    ['vbscript:msgbox(1)'],
    ['data:text/html;base64,PHNjcmlwdD4='],
  ])('image drops the unsafe source %s', (src) => {
    renderStream(`:> image\n - src: "${src}"\n - alt: "unsafe"\n`);
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('directive resolution rules', () => {
  it('accepts the texo- prefixed alias', () => {
    renderStream(':> texo-label\n - text: "aliased"\n');
    expect(screen.getByText('aliased')).toBeTruthy();
  });

  it('still renders the legacy ::: directive form', () => {
    renderStream('::: texo-label\ntext: "legacy"\n:::\n');
    expect(screen.getByText('legacy')).toBeTruthy();
  });

  it('does not crash on an unregistered component', () => {
    expect(() =>
      renderStream(':> not-a-real-component\n - label: "nope"\n'),
    ).not.toThrow();
  });
});
