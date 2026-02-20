import type { IntentNode, IntentPlan } from '@texo-ui/core';

function scalarToYaml(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  return JSON.stringify(String(value));
}

function toDirective(
  node: IntentNode,
): { name: string; attributes: Record<string, unknown> } | null {
  switch (node.type) {
    case 'stack':
      return {
        name: 'stack',
        attributes: { title: node.title, direction: node.direction, gap: node.gap },
      };
    case 'grid':
      return { name: 'grid', attributes: { title: node.title, columns: node.columns } };
    case 'button':
      return {
        name: 'button',
        attributes: { label: node.label, action: node.action, variant: node.variant },
      };
    case 'input':
      return {
        name: 'input',
        attributes: {
          label: node.label,
          name: node.name,
          inputType: node.inputType,
          placeholder: node.placeholder,
        },
      };
    case 'table':
      return { name: 'table', attributes: { columns: node.columns, rows: node.rows } };
    case 'chart':
      return {
        name: 'chart',
        attributes: { chartType: node.chartType, labels: node.labels, series: node.series },
      };
    default:
      return null;
  }
}

export function compileIntentPlanToTexo(plan: IntentPlan): string {
  const lines: string[] = ['# Generated UI', ''];

  for (const node of plan.root.children) {
    if (node.type === 'text') {
      lines.push(node.content);
      lines.push('');
      continue;
    }

    const directive = toDirective(node);
    if (!directive) {
      continue;
    }
    lines.push(`:> ${directive.name}`);
    Object.entries(directive.attributes).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      const serialized =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? scalarToYaml(value)
          : JSON.stringify(value);
      lines.push(` - ${key}: ${serialized}`);
    });
    lines.push('');
  }

  return lines.join('\n').trim();
}
