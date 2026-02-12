import { describe, expect, it } from 'vitest';
import { InteractiveChart } from '../InteractiveChart';

describe('InteractiveChart', () => {
  it('exports component', () => {
    expect(InteractiveChart).toBeTypeOf('function');
  });
});
