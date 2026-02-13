export interface TexoComponentDocProp {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface TexoComponentDoc {
  name: string;
  summary: string;
  props?: TexoComponentDocProp[];
  example?: string;
}

export interface TexoStreamPromptOptions {
  components?: TexoComponentDoc[];
  extraRules?: string[];
}

export const TEXO_STREAM_PRIMER = [
  'You generate Texo stream output for interactive UIs.',
  'Output plain markdown plus Texo directives only.',
  'Directive syntax uses opening and closing blocks:',
  '::: component-name',
  'key: value',
  ':::',
  'Never output JSON wrappers or markdown code fences.',
  'Prefer short explanatory text and then directives.',
  'Use YAML values that are stream-friendly and syntactically valid.',
].join('\n');

function formatComponentDocs(components: TexoComponentDoc[]): string {
  if (components.length === 0) {
    return '';
  }

  return components
    .map((component) => {
      const props = (component.props ?? [])
        .map(
          (prop) =>
            `- ${prop.name}: ${prop.type}${prop.required ? ' (required)' : ''}${prop.description ? `, ${prop.description}` : ''}`,
        )
        .join('\n');

      const example = component.example ? `\nExample:\n${component.example}` : '';
      return `Component ${component.name}: ${component.summary}${props ? `\nProps:\n${props}` : ''}${example}`;
    })
    .join('\n\n');
}

export function buildTexoStreamSystemPrompt(options?: TexoStreamPromptOptions): string {
  const lines: string[] = [TEXO_STREAM_PRIMER];

  if (options?.components && options.components.length > 0) {
    lines.push('Available components:');
    lines.push(formatComponentDocs(options.components));
  }

  if (options?.extraRules && options.extraRules.length > 0) {
    lines.push('Additional rules:');
    options.extraRules.forEach((rule) => lines.push(`- ${rule}`));
  }

  return lines.join('\n\n');
}
