import { describe, expect, it } from 'vitest';
import { TexoPipeline, parseDirectiveHeader } from '../src';

function getDirectives(input: string) {
  const pipeline = new TexoPipeline();
  pipeline.push(input);
  pipeline.end();
  const ast = pipeline.getAST();
  return ast.children.filter((node) => node.type === 'directive');
}

describe('directive parsing', () => {
  it('parses basic directive node', () => {
    const directives = getDirectives('::: card\ntitle: "hi"\n:::\n');
    expect(directives).toHaveLength(1);
    expect((directives[0] as any).name).toBe('card');
  });

  it('parses inline attributes in header', () => {
    const header = parseDirectiveHeader('::: card { mode: dark, value: 1 }');
    expect(header?.name).toBe('card');
    expect(header?.inlineAttributes).toMatchObject({ mode: 'dark', value: 1 });
  });

  it('supports nested yaml body', () => {
    const directives = getDirectives('::: card\nnested:\n  a: 1\n:::\n');
    const directive = directives[0] as any;
    expect(directive.attributes).toMatchObject({ nested: { a: 1 } });
  });

  it('keeps streaming then auto-closes on end', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('::: card\ntitle: "x"\n');
    let directive = pipeline.getAST().children.find((n) => n.type === 'directive') as any;
    expect(directive.status).toBe('streaming');
    pipeline.end();
    directive = pipeline.getAST().children.find((n) => n.type === 'directive') as any;
    expect(directive.status).toBe('complete');
  });

  it('updates attributes incrementally with valid yaml lines', () => {
    const pipeline = new TexoPipeline();
    pipeline.push('::: card\na: 1\n');
    let directive = pipeline.getAST().children.find((n) => n.type === 'directive') as any;
    expect(directive.attributes).toMatchObject({ a: 1 });
    pipeline.push('b: 2\n');
    directive = pipeline.getAST().children.find((n) => n.type === 'directive') as any;
    expect(directive.attributes).toMatchObject({ a: 1, b: 2 });
  });

  it('handles empty directive', () => {
    const directives = getDirectives('::: card\n:::\n');
    expect((directives[0] as any).attributes).toMatchObject({ id: 'directive-1' });
  });

  it('validates directive name format', () => {
    expect(parseDirectiveHeader('::: stats-card')).not.toBeNull();
    expect(parseDirectiveHeader('::: stats card')).toBeNull();
  });

  it('supports multiple directives in document', () => {
    const directives = getDirectives('hi\n::: a\nx: 1\n:::\ntext\n::: b\ny: 2\n:::\n');
    expect(directives).toHaveLength(2);
  });

  it('parses compact :> header with size and color suffix', () => {
    const directives = getDirectives(':> button 100x50 red\n - label: "Go"\ntext\n');
    const directive = directives[0] as any;
    expect(directive.name).toBe('button');
    expect(directive.attributes).toMatchObject({
      id: 'directive-1',
      width: 100,
      height: 50,
      color: 'red',
      label: 'Go',
    });
  });
});
