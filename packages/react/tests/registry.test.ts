import { describe, expect, it, vi } from 'vitest';
import { createRegistry } from '../src/registry';

const Dummy = (): null => null;

describe('component registry', () => {
  it('resolves names case-insensitively and ignores surrounding whitespace', () => {
    const registry = createRegistry({ button: Dummy });
    expect(registry.get('BUTTON')).toBe(Dummy);
    expect(registry.get('  button  ')).toBe(Dummy);
    expect(registry.has('button')).toBe(true);
  });

  it('rejects names that are not kebab-case', () => {
    const registry = createRegistry();
    expect(() => registry.register('Stats_Card', Dummy)).toThrow(/kebab-case/);
    expect(() => registry.register('stats card', Dummy)).toThrow(/kebab-case/);
    expect(() => registry.register('stats-card', Dummy)).not.toThrow();
  });

  it('warns when a name is overwritten', () => {
    const warn = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => undefined);
    const registry = createRegistry({ button: Dummy });
    registry.register('button', Dummy);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('overwriting component: button'));
    warn.mockRestore();
  });

  it('unregisters a component', () => {
    const registry = createRegistry({ button: Dummy });
    registry.unregister('button');
    expect(registry.get('button')).toBeUndefined();
  });
})
