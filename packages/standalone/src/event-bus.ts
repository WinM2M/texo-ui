type EventHandler = (data: unknown) => void;

export class TexoEventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  emit(event: string, data: unknown): void {
    const set = this.handlers.get(event);
    if (!set) {
      return;
    }
    for (const handler of set) {
      handler(data);
    }
    this.dispatchDOMEvent(event, data);
    this.postMessage(event, data);
  }

  on(event: string, handler: EventHandler): () => void {
    const existing = this.handlers.get(event) ?? new Set<EventHandler>();
    existing.add(handler);
    this.handlers.set(event, existing);
    return () => {
      existing.delete(handler);
      if (existing.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  off(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event);
    if (!existing) {
      return;
    }
    existing.delete(handler);
    if (existing.size === 0) {
      this.handlers.delete(event);
    }
  }

  dispatchDOMEvent(eventName: string, detail: unknown): void {
    const windowObj = globalThis as unknown as Window;
    if (!windowObj.document) {
      return;
    }
    const event = new windowObj.CustomEvent(`texo:${eventName}`, { detail });
    windowObj.dispatchEvent(event);
  }

  private postMessage(event: string, data: unknown): void {
    const windowObj = globalThis as unknown as Window;
    if (typeof windowObj.postMessage !== 'function') {
      return;
    }
    windowObj.postMessage({ source: 'texo', event, data }, '*');
  }
}
