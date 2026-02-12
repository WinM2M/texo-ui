import React, { useContext } from 'react';
import type { ComponentRegistry } from '../registry';
import type { TexoAction } from '../types';

interface TexoContextValue {
  registry: ComponentRegistry;
  dispatch: (action: TexoAction) => void;
}

export const TexoContext = React.createContext<TexoContextValue | null>(null);

export function useTexoContext(): TexoContextValue {
  const context = useContext(TexoContext);
  if (!context) {
    throw new Error('useTexoContext must be used within TexoContext provider.');
  }
  return context;
}
