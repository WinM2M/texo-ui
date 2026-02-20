import YAML from 'yaml';
import type { ParserEvent } from '../../types';

export interface DirectiveHeader {
  name: string;
  inlineAttributes: Record<string, unknown>;
}

function normalizeDirectiveName(name: string): string {
  return name.toLowerCase().replace(/^texo-/, '');
}

function parseSuffixTokens(tokensRaw: string): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  const tokens = tokensRaw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  tokens.forEach((token) => {
    const sizeMatch = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i.exec(token);
    if (sizeMatch) {
      attributes.width = Number(sizeMatch[1]);
      attributes.height = Number(sizeMatch[2]);
      return;
    }

    if (/^#[0-9a-fA-F]{3,8}$/.test(token) || /^[a-zA-Z][a-zA-Z0-9-]*$/.test(token)) {
      attributes.color = token;
    }
  });

  return attributes;
}

export function parseDirectiveHeader(line: string): DirectiveHeader | null {
  const trimmed = line.trim();

  const nextSyntax = /^:>\s*([a-zA-Z0-9-]+)(?:\s+(.*))?$/.exec(trimmed);
  if (nextSyntax) {
    const name = normalizeDirectiveName(nextSyntax[1]);
    const inlineAttributes = parseSuffixTokens(nextSyntax[2] ?? '');
    return { name, inlineAttributes };
  }

  const legacyMatch = /^:::\s*([a-zA-Z0-9-]+)\s*(?:\{(.*)\})?\s*$/.exec(trimmed);
  if (!legacyMatch) {
    return null;
  }

  const name = normalizeDirectiveName(legacyMatch[1]);
  const inlineRaw = legacyMatch[2]?.trim();
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

  if (trimmed === ':::' || trimmed === ':>') {
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
