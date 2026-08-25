// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuiltInComponents } from '../../kit/src/registry';
import { TexoRenderer } from '../src/components';

const registry = createBuiltInComponents();

afterEach(() => {
  cleanup();
});

describe('reconciler', () => {
  it('renders an unknown directive through the fallback instead of throwing', () => {
    const Fallback = ({ node }: { node: { name: string } }): React.ReactElement => (
      <div data-testid="fallback">unsupported: {node.name}</div>
    );
    render(
      <TexoRenderer
        content={':> stats-card\n - title: "Monthly Cost"\n'}
        registry={registry}
        fallback={Fallback as never}
      />,
    );
    expect(screen.getByTestId('fallback').textContent).toContain('stats-card');
  });

  it('renders a grid title above the cell layout', () => {
    const { container } = render(
      <TexoRenderer
        content={':> grid\n - id: "board"\n - rows: 1\n - columns: 2\n - title: "Overview"\n'}
        registry={registry}
      />,
    );
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(container.querySelector('.texo-grid-layout')).toBeTruthy();
  });

  it('omits the heading element when a grid has no title', () => {
    const { container } = render(
      <TexoRenderer
        content={':> grid\n - id: "board"\n - rows: 1\n - columns: 2\n'}
        registry={registry}
      />,
    );
    expect(container.querySelector('.texo-grid-title')).toBeNull();
    expect(container.querySelector('.texo-grid-layout')).toBeTruthy();
  });

  it('mounts a directive into the grid cell named by its mount attribute', () => {
    const { container } = render(
      <TexoRenderer
        content={
          ':> grid\n - id: "board"\n - rows: 1\n - columns: 2\n\n' +
          ':> label\n - mount: "board:board/1:2"\n - text: "mounted here"\n'
        }
        registry={registry}
      />,
    );
    const cell = container.querySelector('[data-texo-cell-id="board/1:2"]');
    expect(cell).toBeTruthy();
    expect(cell?.textContent).toContain('mounted here');
  });

  it('reports a recovery event instead of crashing on a malformed directive body', () => {
    const onError = vi.fn();
    expect(() =>
      render(
        <TexoRenderer
          content={'::: table\ncolumns: ["a", "b"\nrows: [\n:::\n'}
          registry={registry}
          onError={onError}
        />,
      ),
    ).not.toThrow();
  });
});
