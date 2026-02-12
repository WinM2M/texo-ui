import YAML from 'yaml';
import type { ParserEvent } from '../../types';

export interface DirectiveHeader {
  name: string;
  inlineAttributes: Record<string, unknown>;
}

export function parseDirectiveHeader(line: string): DirectiveHeader | null {
  const trimmed = line.trim();
  const match = /^:::\s*([a-zA-Z0-9-]+)\s*(?:\{(.*)\})?\s*$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const name = match[1].toLowerCase();
  const inlineRaw = match[2]?.trim();
  const inlineAttributes = inlineRaw ? parseInlineAttributes(inlineRaw) : {};

  return { name, inlineAttributes };
}

function parseInlineAttributes(raw: string): Record<string, unknown> {
  try {
    const parsed = YAML.parse(`{${raw}}`);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

/**
 * Basic directive tokenizer used by the streaming parser.
 * Detailed directive parsing is implemented in work item 003.
 */
export function* tokenizeDirective(
  buffer: string,
  nextChar: () => string | null,
): Generator<ParserEvent> {
  void nextChar;
  const line = buffer.trimEnd();
  const trimmed = line.trim();

  if (trimmed === ':::') {
    yield {
      type: 'directive-close',
      raw: buffer,
      position: { line: 0, column: 0, offset: 0 },
    };
    return;
  }

  if (parseDirectiveHeader(line)) {
    yield {
      type: 'directive-open',
      raw: buffer,
      position: { line: 0, column: 0, offset: 0 },
    };
    return;
  }

  yield {
    type: 'directive-body',
    raw: buffer,
    position: { line: 0, column: 0, offset: 0 },
  };
}
