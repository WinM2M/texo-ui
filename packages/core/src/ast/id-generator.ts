import type { ASTNodeType } from './nodes';

export class DeterministicIdGenerator {
  private counters = new Map<ASTNodeType, number>();

  next(type: ASTNodeType): string {
    const current = this.counters.get(type) ?? 0;
    const nextValue = current + 1;
    this.counters.set(type, nextValue);
    return `${type}-${nextValue}`;
  }

  reset(): void {
    this.counters.clear();
  }
}
