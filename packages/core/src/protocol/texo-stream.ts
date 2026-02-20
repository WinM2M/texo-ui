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

export const TEXO_THEME_PRESETS: Record<string, Record<string, string>> = {
  'slate-light': {
    background: '#f8fafc',
    foreground: '#0f172a',
    accent: '#2563eb',
    line: '#cbd5e1',
    radius: '10px',
  },
  'paper-warm': {
    background: '#fffaf0',
    foreground: '#2b2118',
    accent: '#b45309',
    line: '#e7d8c8',
    radius: '12px',
  },
  'mint-soft': {
    background: '#f0fdf4',
    foreground: '#064e3b',
    accent: '#10b981',
    line: '#a7f3d0',
    radius: '12px',
  },
  'ocean-breeze': {
    background: '#eff6ff',
    foreground: '#0c4a6e',
    accent: '#0284c7',
    line: '#bfdbfe',
    radius: '10px',
  },
  'sunset-soft': {
    background: '#fff7ed',
    foreground: '#7c2d12',
    accent: '#ea580c',
    line: '#fed7aa',
    radius: '12px',
  },
  'rose-quiet': {
    background: '#fff1f2',
    foreground: '#881337',
    accent: '#e11d48',
    line: '#fecdd3',
    radius: '12px',
  },
  'violet-ink': {
    background: '#f5f3ff',
    foreground: '#312e81',
    accent: '#7c3aed',
    line: '#ddd6fe',
    radius: '10px',
  },
  'graphite-dark': {
    background: '#111827',
    foreground: '#f3f4f6',
    accent: '#38bdf8',
    line: '#374151',
    radius: '10px',
  },
  'midnight-dark': {
    background: '#0b1220',
    foreground: '#e2e8f0',
    accent: '#60a5fa',
    line: '#1e293b',
    radius: '10px',
  },
  'forest-dark': {
    background: '#0f1720',
    foreground: '#d1fae5',
    accent: '#34d399',
    line: '#1f3a33',
    radius: '10px',
  },
  'amber-dark': {
    background: '#1c1917',
    foreground: '#ffedd5',
    accent: '#f59e0b',
    line: '#44403c',
    radius: '10px',
  },
  'mono-clean': {
    background: '#ffffff',
    foreground: '#111111',
    accent: '#111111',
    line: '#d4d4d4',
    radius: '8px',
  },
};

export const TEXO_BUTTON_STYLE_PRESETS = [
  'compact',
  'wide',
  'raised',
  'pill',
  'flat',
  'outline-bold',
] as const;

const THEME_PRESET_NAMES = Object.keys(TEXO_THEME_PRESETS).join(', ');
const BUTTON_PRESET_NAMES = TEXO_BUTTON_STYLE_PRESETS.join(', ');

export const TEXO_STREAM_PRIMER = [
  'You generate Texo stream output for interactive UIs.',
  'Output plain markdown plus Texo directives only.',
  'Directive syntax uses single-line open + indented bullet properties:',
  ':> component-name [optional-size] [optional-color]',
  ' - key: value',
  'Directive ends when indented bullet lines stop (Python-like indentation boundary).',
  'Do not emit ::: markers.',
  'Do not use texo- prefixes in component names.',
  'Header suffix parsing rule: token matching <width>x<height> sets width/height; token matching color/hex sets color; unknown tokens are ignored.',
  'Example: :> button 100x50 red',
  'Example: :> rect 200x30 #00ff00',
  'Never output JSON wrappers or markdown code fences.',
  'Prefer short explanatory text and then directives.',
  'Rendering policy: prefer finalized (closed) directives; only prioritize progressive partial rendering when user explicitly asks "과정 표시".',
  'Use stream-friendly values; arrays/objects may be inline JSON-like literals.',
  'Layout mounting protocol:',
  '- Define grid using grid with id, rows and columns. Full cells list is optional.',
  '- If cells are omitted, renderer auto-generates cell ids as "<grid-id>/<row>:<col>".',
  '- For simple grids, avoid listing every cell to reduce stream size and latency.',
  '- Add cells only when span override is required for specific coordinates.',
  '- Prefer 1-based row/column coordinates for cells (renderer also normalizes 0-based input).',
  '- Any component can optionally set mount: "<cell-id>" or mount: "<grid-id>:<cell-id>".',
  '- Components can set id: "<stable-id>" to support in-place updates later in the same stream.',
  '- If id is omitted, parser auto-assigns an id so interactive events can still target the component.',
  '- When updating an existing UI block, reuse the same id so renderer replaces the prior block instead of appending.',
  '- Interaction response rule: when updating after a click/toggle event, include id on every returned directive.',
  '- Grid does not require nested child directives; later directives mount by id.',
  'Theming protocol:',
  '- Use theme for theme tokens.',
  '- Global theme: :> theme then provide scope: "global" and token values using indented bullets.',
  '- Local theme: :> theme then scope: "local" with target mount/grid.',
  `- Prefer theme preset via preset: one of [${THEME_PRESET_NAMES}].`,
  '- Theme tokens can include background, foreground, accent, line, radius, border, paddingY, paddingX, shadow and custom keys.',
  'Button style protocol:',
  `- button can set stylePreset: one of [${BUTTON_PRESET_NAMES}].`,
  '- button can set selected: true|false for selectable/toggle UIs.',
  '- For calculator/keypad UIs prefer stylePreset: "wide" or "raised" for stable touch targets.',
  'Chart protocol:',
  '- For time series use chart with chartType: "line" and 2+ series when requested.',
  '- To allow x-axis switching, set xEditable: true and provide xAxisMode/date options.',
  '- xAxisMode supports label | index | date; with date mode use startDate/dayStep and optional rangeStartDate/rangeEndDate.',
  '- For comparison pie charts, create a second chart with chartType: "pie" using each series last value.',
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
