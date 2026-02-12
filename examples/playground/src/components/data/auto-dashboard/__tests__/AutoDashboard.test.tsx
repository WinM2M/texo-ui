import { describe, expect, it } from 'vitest';
import { AutoDashboard } from '../AutoDashboard';

describe('AutoDashboard', () => {
  it('exports component', () => {
    expect(AutoDashboard).toBeTypeOf('function');
  });
});
