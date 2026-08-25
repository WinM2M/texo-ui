// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createBuiltInComponents } from '../../kit/src/registry';
import { TexoRenderer } from '../src/components';

const registry = createBuiltInComponents();

afterEach(() => {
  cleanup();
});

function textOf(content: string): string {
  const { container } = render(<TexoRenderer content={content} registry={registry} />);
  return container.textContent ?? '';
}

describe('root-level delta updates by id', () => {
  it('replaces a re-emitted id in place rather than appending a duplicate', () => {
    const text = textOf(':> label\n - id: "a"\n - text: "A1"\n\n:> label\n - id: "a"\n - text: "A2"\n');
    expect(text).toBe('A2');
  });

  it('keeps ids independent when several are interleaved and re-emitted', () => {
    // Removing an entry shifts every later index in the id->index map; if that bookkeeping
    // is wrong, re-emitting the second id deletes the wrong node.
    const text = textOf(
      [
        ':> label\n - id: "a"\n - text: "A1"\n',
        ':> label\n - id: "b"\n - text: "B1"\n',
        ':> label\n - id: "a"\n - text: "A2"\n',
        ':> label\n - id: "b"\n - text: "B2"\n',
      ].join('\n'),
    );
    expect(text).toBe('A2B2');
  });

  it('leaves directives without an id untouched', () => {
    const text = textOf(
      ':> label\n - text: "first"\n\n:> label\n - text: "second"\n',
    );
    expect(text).toBe('firstsecond');
  });
});
