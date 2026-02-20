import type { ParserEvent, ParserOptions, Position, TextChunk } from '../types';
import { DEFAULT_STATE, type ParserState } from './states';
import { parseCodeFence } from './tokenizers/code-block';
import { isBlockquote } from './tokenizers/blockquote';
import { createHeadingEvent } from './tokenizers/heading';
import { tokenizeInline } from './tokenizers/inline';
import { isListItem } from './tokenizers/list';
import { parseDirectiveHeader } from './tokenizers/directive';

function clonePosition(position: Position): Position {
  return { ...position };
}

function utf8Length(value: string): number {
  const encoder = globalThis.TextEncoder ? new globalThis.TextEncoder() : null;
  return encoder ? encoder.encode(value).length : value.length;
}

function isHorizontalRule(line: string): boolean {
  return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}

function isDirectiveBodyLine(line: string): boolean {
  return /^ -\s+/.test(line);
}

export class StreamParser {
  private state: ParserState = DEFAULT_STATE;
  private directiveBodyMode: 'legacy' | 'next' | null = null;
  private lineBuffer = '';
  private lineStart: Position = { line: 1, column: 1, offset: 0 };
  private position: Position = { line: 1, column: 1, offset: 0 };
  private options: Required<ParserOptions>;

  constructor(options?: ParserOptions) {
    this.options = {
      emitInlineTokens: options?.emitInlineTokens ?? true,
      maxBufferSize: options?.maxBufferSize ?? 64 * 1024,
      onBufferOverflow: options?.onBufferOverflow ?? (() => {}),
    };
  }

  *feed(chunk: TextChunk): Generator<ParserEvent> {
    if (!chunk) {
      return;
    }

    for (const ch of chunk) {
      this.lineBuffer += ch;
      this.advancePosition(ch);

      if (utf8Length(this.lineBuffer) > this.options.maxBufferSize) {
        yield* this.processLine(this.lineBuffer, clonePosition(this.lineStart), false);
        this.options.onBufferOverflow(clonePosition(this.position));
        this.lineBuffer = '';
        this.lineStart = clonePosition(this.position);
        this.state = 'IDLE';
        continue;
      }

      if (ch === '\n') {
        const line = this.lineBuffer.slice(0, -1);
        yield* this.processLine(line, clonePosition(this.lineStart), true);
        this.lineBuffer = '';
        this.lineStart = clonePosition(this.position);
      }
    }
  }

  *flush(): Generator<ParserEvent> {
    if (this.lineBuffer.length > 0) {
      yield* this.processLine(this.lineBuffer, clonePosition(this.lineStart), false);
      this.lineBuffer = '';
      this.lineStart = clonePosition(this.position);
    }

    if (this.state === 'CODE_BLOCK') {
      yield {
        type: 'code-block-end',
        raw: '```',
        position: clonePosition(this.position),
      };
      this.state = 'IDLE';
    }
  }

  reset(): void {
    this.state = DEFAULT_STATE;
    this.directiveBodyMode = null;
    this.lineBuffer = '';
    this.lineStart = { line: 1, column: 1, offset: 0 };
    this.position = { line: 1, column: 1, offset: 0 };
  }

  private *processLine(
    line: string,
    linePosition: Position,
    hasNewline: boolean,
  ): Generator<ParserEvent> {
    const trimmed = line.trim();

    if (this.state === 'CODE_BLOCK') {
      if (parseCodeFence(line)) {
        yield { type: 'code-block-end', raw: line, position: linePosition };
        this.state = 'IDLE';
      } else {
        yield { type: 'code-block-content', raw: line, position: linePosition };
      }
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      return;
    }

    if (this.state === 'DIRECTIVE_BODY') {
      const isLegacyMode = this.directiveBodyMode === 'legacy';

      if (trimmed === ':::' || trimmed === ':>') {
        yield { type: 'directive-close', raw: line, position: linePosition };
        this.state = 'IDLE';
        this.directiveBodyMode = null;
        if (hasNewline) {
          yield this.newlineEvent(linePosition, line.length);
        }
        return;
      }

      if (isLegacyMode) {
        yield { type: 'directive-body', raw: line, position: linePosition };
        if (hasNewline) {
          yield this.newlineEvent(linePosition, line.length);
        }
        return;
      }

      if (isDirectiveBodyLine(line)) {
        yield { type: 'directive-body', raw: line, position: linePosition };
        if (hasNewline) {
          yield this.newlineEvent(linePosition, line.length);
        }
        return;
      }

      yield { type: 'directive-close', raw: '', position: linePosition };
      this.state = 'IDLE';
      this.directiveBodyMode = null;
      yield* this.processLine(line, linePosition, hasNewline);
      return;
    }

    if (trimmed.length === 0) {
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      return;
    }

    const codeFence = parseCodeFence(line);
    if (codeFence) {
      this.state = 'CODE_BLOCK';
      yield {
        type: 'code-block-start',
        raw: line,
        position: linePosition,
      };
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      return;
    }

    const hasDirectiveMarker = /^:::\s*\S+/.test(trimmed) || /^:>\s*\S+/.test(trimmed);
    if (parseDirectiveHeader(line) || hasDirectiveMarker) {
      this.state = 'DIRECTIVE_BODY';
      this.directiveBodyMode = trimmed.startsWith(':::') ? 'legacy' : 'next';
      yield {
        type: 'directive-open',
        raw: line,
        position: linePosition,
      };
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      return;
    }

    if (isHorizontalRule(line)) {
      yield {
        type: 'hr',
        raw: line,
        position: linePosition,
      };
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      return;
    }

    const heading = createHeadingEvent(line, linePosition);
    if (heading) {
      this.state = 'HEADING';
      yield heading;
      if (this.options.emitInlineTokens) {
        const contentStart = line.indexOf(' ') + 1;
        const content = contentStart > 0 ? line.slice(contentStart) : '';
        const inlineBase: Position = {
          line: linePosition.line,
          column: linePosition.column + Math.max(contentStart, 0),
          offset: linePosition.offset + Math.max(contentStart, 0),
        };
        yield* tokenizeInline(content, inlineBase);
      }
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      this.state = 'IDLE';
      return;
    }

    if (isListItem(line)) {
      this.state = 'LIST';
      yield {
        type: 'list-item',
        raw: line,
        position: linePosition,
      };
      if (this.options.emitInlineTokens) {
        yield* tokenizeInline(line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, ''), linePosition);
      }
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      this.state = 'IDLE';
      return;
    }

    if (isBlockquote(line)) {
      this.state = 'BLOCKQUOTE';
      yield {
        type: 'blockquote',
        raw: line,
        position: linePosition,
      };
      if (this.options.emitInlineTokens) {
        yield* tokenizeInline(line.replace(/^\s*>\s?/, ''), linePosition);
      }
      if (hasNewline) {
        yield this.newlineEvent(linePosition, line.length);
      }
      this.state = 'IDLE';
      return;
    }

    this.state = 'TEXT';
    yield {
      type: 'paragraph',
      raw: line,
      position: linePosition,
    };

    if (this.options.emitInlineTokens) {
      yield* tokenizeInline(line, linePosition);
    } else {
      yield {
        type: 'text',
        raw: line,
        position: linePosition,
      };
    }

    if (hasNewline) {
      yield this.newlineEvent(linePosition, line.length);
    }

    this.state = 'IDLE';
  }

  private newlineEvent(linePosition: Position, lineLength: number): ParserEvent {
    return {
      type: 'newline',
      raw: '\n',
      position: {
        line: linePosition.line,
        column: linePosition.column + lineLength,
        offset: linePosition.offset + lineLength,
      },
    };
  }

  private advancePosition(ch: string): void {
    this.position.offset += 1;
    if (ch === '\n') {
      this.position.line += 1;
      this.position.column = 1;
      return;
    }

    this.position.column += 1;
  }
}
