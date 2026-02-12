import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { DEFAULT_STYLES } from './styles/default-styles';

function resolveElement(target: string | HTMLElement): HTMLElement {
  if (typeof target !== 'string') {
    return target;
  }

  const documentObj = (globalThis as unknown as Window).document;
  const found = documentObj.querySelector(target);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`Texo target not found: ${target}`);
  }
  return found;
}

export class TexoShadowHost {
  private hostElement: HTMLElement;
  private shadowRoot: ShadowRoot;
  private mount: HTMLDivElement;
  private reactRoot: Root;

  constructor(selector: string | HTMLElement) {
    const host = resolveElement(selector);
    this.hostElement = host;
    this.shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

    this.mount = (globalThis as unknown as Window).document.createElement('div');
    this.mount.className = 'texo-shadow-mount';

    this.shadowRoot.innerHTML = '';
    this.injectStyle(DEFAULT_STYLES);
    this.shadowRoot.appendChild(this.mount);
    this.reactRoot = createRoot(this.mount);
  }

  render(element: React.ReactElement): void {
    this.reactRoot.render(element);
  }

  injectStyle(css: string): void {
    const style = (globalThis as unknown as Window).document.createElement('style');
    style.textContent = css;
    this.shadowRoot.appendChild(style);
  }

  async loadStylesheet(url: string): Promise<void> {
    const link = (globalThis as unknown as Window).document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    this.shadowRoot.appendChild(link);
    await new Promise<void>((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
    });
  }

  destroy(): void {
    this.reactRoot.unmount();
    this.shadowRoot.innerHTML = '';
  }

  getShadowRoot(): ShadowRoot {
    return this.shadowRoot;
  }
}
