import type React from 'react';

export interface ComponentRegistry {
  components: Map<string, React.ComponentType<Record<string, unknown>>>;
  register(name: string, component: React.ComponentType<Record<string, unknown>>): void;
  registerAll(map: Record<string, React.ComponentType<Record<string, unknown>>>): void;
  get(name: string): React.ComponentType<Record<string, unknown>> | undefined;
  has(name: string): boolean;
  unregister(name: string): void;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isValidKebabCase(name: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

export function createRegistry(
  initialComponents?: Record<string, React.ComponentType<Record<string, unknown>>>,
): ComponentRegistry {
  const components = new Map<string, React.ComponentType<Record<string, unknown>>>();

  const registry: ComponentRegistry = {
    components,
    register(name, component): void {
      const normalized = normalizeName(name);
      if (!isValidKebabCase(normalized)) {
        throw new Error(`Invalid component name '${name}'. Expected kebab-case.`);
      }
      if (components.has(normalized)) {
        globalThis.console.warn(`[texo] overwriting component: ${normalized}`);
      }
      components.set(normalized, component);
    },
    registerAll(map): void {
      for (const [name, component] of Object.entries(map)) {
        registry.register(name, component);
      }
    },
    get(name): React.ComponentType<Record<string, unknown>> | undefined {
      return components.get(normalizeName(name));
    },
    has(name): boolean {
      return components.has(normalizeName(name));
    },
    unregister(name): void {
      components.delete(normalizeName(name));
    },
  };

  if (initialComponents) {
    registry.registerAll(initialComponents);
  }

  return registry;
}
