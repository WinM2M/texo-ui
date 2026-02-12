import React, { useEffect, useRef } from 'react';

export interface ComponentRenderFunction {
  (container: HTMLElement, props: Record<string, unknown>): void | (() => void);
}

export function wrapVanillaComponent(
  renderFn: ComponentRenderFunction,
): React.ComponentType<Record<string, unknown>> {
  return function VanillaWrappedComponent(props: Record<string, unknown>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cleanupRef = useRef<(() => void) | void>(undefined);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }

      cleanupRef.current = renderFn(container, props);
      return () => {
        if (typeof cleanupRef.current === 'function') {
          cleanupRef.current();
        }
      };
    }, [props]);

    return <div ref={containerRef} className="texo-vanilla-component" />;
  };
}
