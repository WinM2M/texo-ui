// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { createBuiltInComponents } from '@texo-ui/kit';
import { TexoRenderer } from '@texo-ui/react';
import { afterEach, describe, expect, it } from 'vitest';
import { allScenarios } from '../scenarios';

const registry = createBuiltInComponents();

afterEach(() => {
  cleanup();
});

describe.each(allScenarios.map((scenario) => [scenario.id, scenario] as const))(
  'scenario %s renders',
  (_id, scenario) => {
    it('produces a directive-backed DOM tree, not just text', () => {
      const { container } = render(
        <TexoRenderer content={scenario.content} registry={registry} />,
      );
      const rendered = container.querySelectorAll('.texo-directive, .texo-grid-layout');
      expect(rendered.length).toBeGreaterThan(0);
    });

    it('carries its declared attribute values into the DOM', () => {
      const { container } = render(
        <TexoRenderer content={scenario.content} registry={registry} />,
      );
      // Every string value the scenario declares for a rendered prop should be reachable
      // in the output; this is what catches an attribute lost during a syntax migration.
      const declaredLabels = [...scenario.content.matchAll(/ - (?:label|text|title): "([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(declaredLabels.length).toBeGreaterThan(0);
      for (const value of declaredLabels) {
        expect(container.textContent, `missing "${value}"`).toContain(value);
      }
    });
  },
);
