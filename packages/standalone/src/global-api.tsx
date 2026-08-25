import React from 'react';
import { TexoRenderer, createRegistry, type TexoAction } from '@texo-ui/react';
import type { RecoveryEvent } from '@texo-ui/core';
import { TEXO_STREAM_PRIMER } from '@texo-ui/core';
import { BUILTIN_COMPONENT_CATALOG, createBuiltInComponents } from '@texo-ui/kit';
import { wrapVanillaComponent, type ComponentRenderFunction } from './adapters/vanilla-adapter';
import { TexoEventBus } from './event-bus';
import { TexoShadowHost } from './shadow-host';
import type { TexoGlobal, TexoInitOptions, TexoInstance } from './types';

function renderWithContent(
  host: TexoShadowHost,
  content: string,
  registry: ReturnType<typeof createRegistry>,
  options?: TexoInitOptions,
  eventBus?: TexoEventBus,
): void {
  host.render(
    <TexoRenderer
      content={content}
      registry={registry}
      injectBaseStyles={false}
      streamOptions={{ recovery: options?.recovery }}
      onAction={(payload): void => {
        eventBus?.emit('action', payload);
      }}
      onError={(error): void => {
        eventBus?.emit('error', error);
      }}
    />,
  );
}

function createTexoInstance(
  selector: string | HTMLElement,
  options?: TexoInitOptions,
): TexoInstance {
  const host = new TexoShadowHost(selector);
  const eventBus = new TexoEventBus();
  const registry = createRegistry(createBuiltInComponents());
  let content = '';

  if (options?.stylesheetUrl) {
    host.loadStylesheet(options.stylesheetUrl).catch((error) => {
      eventBus.emit('error', error);
    });
  }

  renderWithContent(host, content, registry, options, eventBus);

  const instance: TexoInstance = {
    stream(chunk: string): void {
      content += chunk;
      renderWithContent(host, content, registry, options, eventBus);
    },
    render(nextContent: string): void {
      content = nextContent;
      renderWithContent(host, content, registry, options, eventBus);
    },
    end(): void {
      renderWithContent(host, content, registry, options, eventBus);
    },
    reset(): void {
      content = '';
      renderWithContent(host, content, registry, options, eventBus);
    },
    on(event: 'action' | 'error' | 'ready', handler: (payload: unknown) => void): void {
      eventBus.on(event, handler);
    },
    off(event: string, handler: (payload: unknown) => void): void {
      eventBus.off(event, handler);
    },
    registerComponent(name: string, renderFn: ComponentRenderFunction): void {
      registry.register(name, wrapVanillaComponent(renderFn));
      renderWithContent(host, content, registry, options, eventBus);
    },
    addStyle(css: string): void {
      host.injectStyle(css);
    },
    destroy(): void {
      host.destroy();
    },
  };

  eventBus.emit('ready', undefined);
  return instance;
}

export function createTexoGlobal(version = '0.1.0'): TexoGlobal {
  return {
    version,
    // A page that talks to a model directly needs the system prompt that teaches the
    // directive syntax, and the catalog it is derived from. Without them the drop-in
    // bundle can render a stream but cannot obtain one.
    primer: TEXO_STREAM_PRIMER,
    catalog: BUILTIN_COMPONENT_CATALOG,
    init(selector: string | HTMLElement, options?: TexoInitOptions): TexoInstance {
      return createTexoInstance(selector, options);
    },
  };
}

export type { ComponentRenderFunction, RecoveryEvent, TexoAction };
