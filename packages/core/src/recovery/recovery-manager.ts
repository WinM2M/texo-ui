import type { ASTNode, DirectiveNode } from '../ast';
import type { Position } from '../types';
import { RECOVERY_MESSAGES } from './error-catalog';
import { safeYAMLParse } from './safe-yaml';

export type RecoveryEventType =
  | 'yaml-parse-error'
  | 'unclosed-directive'
  | 'buffer-overflow'
  | 'unclosed-inline'
  | 'invalid-directive-name'
  | 'invalid-input';

export interface RecoveryEvent {
  type: RecoveryEventType;
  message: string;
  position?: Position;
  recoveryAction: string;
}

export interface RecoveryConfig {
  maxBufferSize: number;
  directiveTimeout: number;
  unknownDirective: 'fallback-text' | 'fallback-code-block' | 'ignore';
  onRecovery?: (error: RecoveryEvent) => void;
}

const DEFAULT_CONFIG: RecoveryConfig = {
  maxBufferSize: 64 * 1024,
  directiveTimeout: 30_000,
  unknownDirective: 'fallback-text',
};

function utf8Slice(value: string, maxBytes: number): string {
  const encoder = globalThis.TextEncoder ? new globalThis.TextEncoder() : null;
  const decoder = globalThis.TextDecoder ? new globalThis.TextDecoder() : null;
  if (!encoder || !decoder) {
    return value.slice(0, maxBytes);
  }
  const encoded = encoder.encode(value);
  const sliced = encoded.slice(0, maxBytes);
  return decoder.decode(sliced);
}

export class RecoveryManager {
  private config: RecoveryConfig;

  constructor(config?: Partial<RecoveryConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  getConfig(): RecoveryConfig {
    return { ...this.config };
  }

  validateInput(chunk: unknown): string {
    if (typeof chunk !== 'string') {
      this.report('invalid-input', undefined, 'Ignored non-string input chunk.');
      return '';
    }

    if (chunk.length === 0) {
      return '';
    }

    const sanitized = chunk.split('\u0000').join('');
    const encoder = globalThis.TextEncoder ? new globalThis.TextEncoder() : null;
    const byteLength = encoder ? encoder.encode(sanitized).length : sanitized.length;
    if (byteLength > this.config.maxBufferSize) {
      this.report(
        'buffer-overflow',
        undefined,
        'Truncated oversized chunk to maxBufferSize bytes.',
      );
      return utf8Slice(sanitized, this.config.maxBufferSize);
    }

    return sanitized;
  }

  recoverYAML(rawBody: string, lastValid: Record<string, unknown>): Record<string, unknown> {
    const parsed = safeYAMLParse(rawBody, lastValid);
    if (parsed.error) {
      this.report('yaml-parse-error', undefined, 'Kept last valid YAML attributes.');
      return lastValid;
    }
    return parsed.result;
  }

  checkDirectiveTimeout(directive: DirectiveNode, elapsedMs: number): boolean {
    const timedOut = elapsedMs > this.config.directiveTimeout;
    if (timedOut) {
      this.report(
        'unclosed-directive',
        directive.position,
        'Marked directive as recovered due to timeout.',
      );
    }
    return timedOut;
  }

  recoverInlineMarkup(buffer: string): ASTNode[] {
    if (!/(\*\*|`|\*)/.test(buffer)) {
      return [];
    }

    this.report('unclosed-inline', undefined, 'Returned buffer as plain text.');
    return [
      {
        id: 'recovered-inline-1',
        type: 'text',
        meta: { recovered: true },
        children: undefined,
      } as ASTNode,
    ];
  }

  reportInvalidDirective(position?: Position): void {
    this.report(
      'invalid-directive-name',
      position,
      'Changed invalid directive to safe fallback mode.',
    );
  }

  private report(
    type: RecoveryEventType,
    position: Position | undefined,
    recoveryAction: string,
  ): void {
    this.config.onRecovery?.({
      type,
      message: RECOVERY_MESSAGES[type],
      position,
      recoveryAction,
    });
  }
}
