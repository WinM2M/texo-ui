import { TexoPipeline } from '@texo-ui/core';
import type { ASTNode, DirectiveNode } from '@texo-ui/core';
import { RECONCILER_DIRECTIVES } from '@texo-ui/react';
import { describe, expect, it } from 'vitest';
import { BUILTIN_COMPONENT_CATALOG } from '../src/catalog';
import { createBuiltInComponents } from '../src/registry';

const registry = createBuiltInComponents();
const resolvable = new Set([...Object.keys(registry), ...RECONCILER_DIRECTIVES]);

function parseDirectives(content: string): DirectiveNode[] {
  const pipeline = new TexoPipeline();
  pipeline.push(content.endsWith('\n') ? content : `${content}\n`);
  pipeline.end();
  return pipeline
    .getAST()
    .children.filter((node: ASTNode): node is DirectiveNode => node.type === 'directive');
}

describe('component catalog is a truthful description of what exists', () => {
  it('documents every component the LLM is allowed to invoke, and nothing else', () => {
    const documented = new Set(BUILTIN_COMPONENT_CATALOG.map((entry) => entry.name));
    expect([...documented].sort()).toEqual([...resolvable].sort());
  });

  it('has no duplicate entries', () => {
    const names = BUILTIN_COMPONENT_CATALOG.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(BUILTIN_COMPONENT_CATALOG.map((entry) => [entry.name, entry] as const))(
    "%s: the documented example parses into the component it claims to document",
    (name, entry) => {
      const directives = parseDirectives(entry.example);
      expect(directives.length).toBeGreaterThan(0);
      expect(directives[0].name).toBe(name);
    },
  );

  it.each(BUILTIN_COMPONENT_CATALOG.map((entry) => [entry.name, entry] as const))(
    '%s: the documented example only uses documented props',
    (_name, entry) => {
      const declared = new Set(entry.props.map((prop) => prop.name));
      // Attributes the runtime understands for every directive, independent of the component.
      const universal = new Set(['id', 'mount', 'width', 'height', 'color']);
      const used = Object.keys(parseDirectives(entry.example)[0]?.attributes ?? {});
      const undocumented = used.filter((key) => !declared.has(key) && !universal.has(key));
      expect(undocumented).toEqual([]);
    },
  );

  it('uses the current :> directive syntax in every example', () => {
    for (const entry of BUILTIN_COMPONENT_CATALOG) {
      expect(entry.example, `${entry.name} example`).toMatch(/^:>\s/);
      expect(entry.example, `${entry.name} example`).not.toContain(':::');
    }
  });

  it('never advertises the texo- prefixed spelling', () => {
    for (const entry of BUILTIN_COMPONENT_CATALOG) {
      expect(entry.name.startsWith('texo-')).toBe(false);
      expect(entry.example).not.toContain(':> texo-');
    }
  });
});

