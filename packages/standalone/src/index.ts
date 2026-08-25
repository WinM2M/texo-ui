import { createTexoGlobal } from './global-api';

const texoGlobal = createTexoGlobal();

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { Texo?: typeof texoGlobal }).Texo = texoGlobal;
}

// Vite's library mode wraps this module and assigns the namespace object to
// `window.Texo`, clobbering the assignment above. Re-export the drop-in API as named
// exports so `Texo.init(...)` works either way.
export const init = texoGlobal.init;
export const version = texoGlobal.version;

export * from './adapters/vanilla-adapter';
export * from './event-bus';
export * from './global-api';
export * from './shadow-host';
export * from './types';
