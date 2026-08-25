import { TexoPipeline } from '@texo-ui/core';
import type { ASTNode, DirectiveNode } from '@texo-ui/core';
import { BUILTIN_COMPONENT_CATALOG, createBuiltInComponents } from '@texo-ui/kit';
import { LAYOUT_DIRECTIVES } from '@texo-ui/react';
import { describe, expect, it } from 'vitest';
import { allScenarios } from '../scenarios';

const resolvable = new Set([...Object.keys(createBuiltInComponents()), ...LAYOUT_DIRECTIVES]);
const documented = new Set(BUILTIN_COMPONENT_CATALOG.map((entry) => entry.name));

function directivesOf(content: string): DirectiveNode[] {
  const pipeline = new TexoPipeline();
  pipeline.push(content.endsWith('\n') ? content : `${content}\n`);
  pipeline.end();
  return pipeline
    .getAST()
    .children.filter((node: ASTNode): node is DirectiveNode => node.type === 'directive');
}

describe('playground scenarios', () => {
  it('exposes at least one scenario', () => {
    expect(allScenarios.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = allScenarios.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allScenarios.map((scenario) => [scenario.id, scenario] as const))(
    '%s: every directive resolves to a component that exists',
    (_id, scenario) => {
      const directives = directivesOf(scenario.content);
      expect(directives.length).toBeGreaterThan(0);
      const unresolved = directives.map((node) => node.name).filter((name) => !resolvable.has(name));
      expect(unresolved).toEqual([]);
    },
  );

  it.each(allScenarios.map((scenario) => [scenario.id, scenario] as const))(
    '%s: every directive is documented in the catalog',
    (_id, scenario) => {
      const undocumented = directivesOf(scenario.content)
        .map((node) => node.name)
        .filter((name) => !documented.has(name));
      expect(undocumented).toEqual([]);
    },
  );

  it.each(allScenarios.map((scenario) => [scenario.id, scenario] as const))(
    '%s: models the output the primer actually asks an LLM for',
    (_id, scenario) => {
      // TEXO_STREAM_PRIMER: "Do not emit ::: markers." / "Do not use texo- prefixes".
      // A canned scenario stands in for LLM output, so it must obey the same rules.
      expect(scenario.content).not.toContain(':::');
      expect(scenario.content).not.toMatch(/:>\s*texo-/);
    },
  );

  it.each(allScenarios.map((scenario) => [scenario.id, scenario] as const))(
    '%s: only mentions real component names in its system prompt',
    (_id, scenario) => {
      const mentioned = scenario.systemPrompt.match(/texo-[a-z]+/g) ?? [];
      expect(mentioned).toEqual([]);
    },
  );
});
