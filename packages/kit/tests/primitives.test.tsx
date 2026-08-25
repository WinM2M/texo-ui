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
