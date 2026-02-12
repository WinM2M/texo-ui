import { ASTBuilder } from './ast';
import { StreamParser } from './parser';
import type { ASTNode, RootNode } from './ast';

type PipelineListener = (ast: RootNode, dirty: ASTNode[]) => void;

export class TexoPipeline {
  private parser = new StreamParser();
  private builder = new ASTBuilder();
  private listeners = new Set<PipelineListener>();
  private lastDirtyNodes: ASTNode[] = [];

  push(chunk: string): void {
    for (const token of this.parser.feed(chunk)) {
      this.builder.addToken(token);
    }
    this.publishIfDirty();
  }

  getAST(): RootNode {
    return this.builder.getTree();
  }

  getDirtyNodes(): ASTNode[] {
    return this.lastDirtyNodes.map((node) => ({
      ...node,
      children: node.children ? [...node.children] : undefined,
    }));
  }

  subscribe(listener: PipelineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  end(): void {
    for (const token of this.parser.flush()) {
      this.builder.addToken(token);
    }
    this.publishIfDirty();
  }

  reset(): void {
    this.parser.reset();
    this.builder.reset();
    this.lastDirtyNodes = [];
    this.publishIfDirty();
  }

  private publishIfDirty(): void {
    const dirty = this.builder.getDirtyNodes();
    if (dirty.length === 0) {
      return;
    }

    this.lastDirtyNodes = dirty;
    const ast = this.builder.getTree();
    for (const listener of this.listeners) {
      listener(ast, dirty);
    }
    this.builder.clearDirtyNodes();
  }
}
