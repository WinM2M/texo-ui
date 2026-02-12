import { describe, expect, it } from 'vitest';
import { ExpenseList } from '../ExpenseList';

describe('ExpenseList', () => {
  it('exports component', () => {
    expect(ExpenseList).toBeTypeOf('function');
  });
});
