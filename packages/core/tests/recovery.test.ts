import { describe, expect, it } from 'vitest';
import type { DirectiveNode } from '../src';
import {
  RecoveryManager,
  TexoPipeline,
  createSafePipeline,
  parseDirectiveHeader,
  safeYAMLParse,
} from '../src';

describe('RecoveryManager and safe pipeline', () => {
  it('E1 unclosed directive auto-closes on end', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('::: card\na: 1\n');
    pipeline.end();
    const directive = pipeline.getAST().children.find((n) => n.type === 'directive') as DirectiveNode;
    expect(directive.status).toBe('complete');
    expect(directive.meta?.recovered).toBe(true);
  });

  it('E2 invalid yaml keeps last valid body', () => {
    const rm = new RecoveryManager();
    expect(rm.recoverYAML('a: 1\nb: [', { a: 1 })).toEqual({ a: 1 });
  });

  it('E3 unknown directive fallback name', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('::: invalid name\na: 1\n:::\n');
    pipeline.end();
    const directive = pipeline.getAST().children.find((n) => n.type === 'directive') as DirectiveNode;
    expect(directive.name).toBe('unknown');
    expect(directive.meta?.recovered).toBe(true);
  });

  it('E4 nested directive inside body treated as text body', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('::: card\ninner: "::: x"\n:::\n');
    pipeline.end();
    const directive = pipeline.getAST().children.find((n) => n.type === 'directive') as DirectiveNode;
    expect(directive.rawBody.includes('::: x')).toBe(true);
  });

  it('E5 directive markers ignored inside code block', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('```\n::: card\n```\n');
    pipeline.end();
    expect(pipeline.getAST().children.some((n) => n.type === 'directive')).toBe(false);
  });

  it('E6 unclosed inline falls back as text token', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('**bold without close\n');
    pipeline.end();
    const hasText = JSON.stringify(pipeline.getAST()).includes('bold without close');
    expect(hasText).toBe(true);
  });

  it('E7 utf8 corrupted replacement char does not break parser', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('bad\uFFFDtext\n');
    pipeline.end();
    expect(pipeline.getAST().children.length).toBeGreaterThan(0);
  });

  it('E8 null and undefined inputs are ignored', () => {
    const pipeline = createSafePipeline();
    pipeline.push(undefined);
    pipeline.push(null);
    pipeline.push('ok\n');
    pipeline.end();
    expect(pipeline.getAST().children.length).toBeGreaterThan(0);
  });

  it('E9 long line buffer overflow triggers recovery callback', () => {
    const events: string[] = [];
    const pipeline = createSafePipeline({
      maxBufferSize: 32,
      onRecovery: (e) => events.push(e.type),
    });
    pipeline.push('a'.repeat(100));
    pipeline.end();
    expect(events).toContain('buffer-overflow');
  });

  it('E10 invalid directive name detected', () => {
    expect(parseDirectiveHeader('::: bad name')).toBeNull();
  });

  it('E11 handles consecutive errors safely', () => {
    const pipeline = createSafePipeline({ maxBufferSize: 32 });
    pipeline.push(undefined);
    pipeline.push('::: bad name\na: [\n');
    pipeline.push('a'.repeat(100));
    pipeline.end();
    expect(pipeline.getAST().type).toBe('root');
  });

  it('E12 onRecovery callback fires', () => {
    const events: string[] = [];
    const pipeline = createSafePipeline({
      onRecovery: (e) => events.push(e.type),
    });
    pipeline.push(undefined);
    pipeline.end();
    expect(events).toContain('invalid-input');
  });

  it('E13 safeYAMLParse recovers line-by-line', () => {
    const result = safeYAMLParse('a: 1\nb: [', { a: 1 });
    expect(result.result).toEqual({ a: 1 });
  });
});
