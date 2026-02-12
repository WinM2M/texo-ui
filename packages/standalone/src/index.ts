import { createTexoGlobal } from './global-api';

const texoGlobal = createTexoGlobal();

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { Texo?: typeof texoGlobal }).Texo = texoGlobal;
}

export * from './adapters/vanilla-adapter';
export * from './event-bus';
export * from './global-api';
export * from './shadow-host';
export * from './types';
