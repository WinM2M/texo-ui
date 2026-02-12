import { describe, expect, it } from 'vitest';
import { DynamicForm } from '../DynamicForm';

describe('DynamicForm', () => {
  it('exports component', () => {
    expect(DynamicForm).toBeTypeOf('function');
  });
});
