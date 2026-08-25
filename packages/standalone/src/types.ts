import type { CatalogComponent } from '@texo-ui/kit';
import type { RecoveryConfig } from '@texo-ui/core';
import type { ComponentRenderFunction } from './adapters/vanilla-adapter';

export interface TexoInstance {
  stream(chunk: string): void;
  render(content: string): void;
  end(): void;
  reset(): void;
  on(event: 'action' | 'error' | 'ready', handler: (payload: unknown) => void): void;
  off(event: string, handler: (payload: unknown) => void): void;
  registerComponent(name: string, renderFn: ComponentRenderFunction): void;
  addStyle(css: string): void;
  destroy(): void;
}

export interface TexoInitOptions {
  theme?: 'light' | 'dark' | 'auto';
  stylesheetUrl?: string;
  recovery?: Partial<RecoveryConfig>;
}

export interface TexoGlobal {
  init(selector: string | HTMLElement, options?: TexoInitOptions): TexoInstance;
  version: string;
  /** System prompt that teaches a model the Texo directive syntax. */
  primer: string;
  /** Machine-readable description of every component a model may invoke. */
  catalog: readonly CatalogComponent[];
}
