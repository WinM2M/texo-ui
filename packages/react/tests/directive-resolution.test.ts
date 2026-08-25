import { TexoPipeline } from '@texo-ui/core';
import type { ASTNode, DirectiveNode } from '@texo-ui/core';
import { describe, expect, it } from 'vitest';
import { createBuiltInComponents } from '../../kit/src/registry';
import { LAYOUT_DIRECTIVES } from '../src/reconciler';

function directiveNames(content: string): string[] {
  const pipeline = new TexoPipeline();
  pipeline.push(content);
  pipeline.end();
  return pipeline
    .getAST()
    .children.filter((node: ASTNode): node is DirectiveNode => node.type === 'directive')
    .map((node) => node.name);
}

describe('directive name resolution contract', () => {
  it('strips the texo- prefix before the registry is consulted', () => {
    // The kit registry only holds unprefixed names; this normalization is what makes
    // `:> texo-button` work. If it ever changes, the registry must grow aliases again.
    expect(directiveNames(':> texo-label\n - text: "x"\n')).toEqual(['label']);
    expect(directiveNames('::: texo-button\nlabel: "x"\n:::\n')).toEqual(['button']);
  });

  it('every registered name is already normalized', () => {
    for (const name of Object.keys(createBuiltInComponents())) {
      expect(name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(name.startsWith('texo-')).toBe(false);
    }
  });

  it('layout directives are not registry components', () => {
    const registry = createBuiltInComponents();
    for (const name of LAYOUT_DIRECTIVES) {
      expect(registry[name]).toBeUndefined();
    }
  });
});
