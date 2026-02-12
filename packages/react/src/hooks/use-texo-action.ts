import { useCallback, useRef } from 'react';
import type { TexoAction } from '../types';

interface UseTexoActionReturn {
  dispatch: (action: TexoAction) => void;
  onAction: (handler: (action: TexoAction) => void) => () => void;
}

export function useTexoAction(): UseTexoActionReturn {
  const handlersRef = useRef(new Set<(action: TexoAction) => void>());

  const dispatch = useCallback((action: TexoAction): void => {
    for (const handler of handlersRef.current) {
      handler(action);
    }
  }, []);

  const onAction = useCallback((handler: (action: TexoAction) => void): (() => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return {
    dispatch,
    onAction,
  };
}
