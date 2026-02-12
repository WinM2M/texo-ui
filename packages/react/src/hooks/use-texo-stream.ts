import type { RecoveryEvent, RootNode } from '@texo-ui/core';
import { TexoPipeline } from '@texo-ui/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UseTexoStreamOptions, UseTexoStreamReturn } from '../types';

const EMPTY_AST: RootNode = {
  id: 'root-0',
  type: 'root',
  children: [],
};

export function useTexoStream(options?: UseTexoStreamOptions): UseTexoStreamReturn {
  const [ast, setAST] = useState<RootNode>(EMPTY_AST);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errors, setErrors] = useState<RecoveryEvent[]>([]);

  const pipeline = useMemo(
    () =>
      new TexoPipeline({
        recovery: {
          ...options?.recovery,
          onRecovery: (event): void => {
            options?.recovery?.onRecovery?.(event);
            setErrors((prev) => [...prev, event]);
          },
        },
      }),
    [options?.recovery],
  );

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubscribeRef.current = pipeline.subscribe((nextAST) => {
      setAST(nextAST);
    });

    if (options?.initialContent) {
      pipeline.push(options.initialContent);
      pipeline.end();
      setIsStreaming(false);
      setAST(pipeline.getAST());
    }

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [options?.initialContent, pipeline]);

  const push = useCallback(
    (chunk: string): void => {
      setIsStreaming(true);
      pipeline.push(chunk);
      setAST(pipeline.getAST());
    },
    [pipeline],
  );

  const end = useCallback((): void => {
    pipeline.end();
    setAST(pipeline.getAST());
    setIsStreaming(false);
  }, [pipeline]);

  const reset = useCallback((): void => {
    pipeline.reset();
    setErrors([]);
    setAST(pipeline.getAST());
    setIsStreaming(false);
  }, [pipeline]);

  return {
    ast,
    push,
    end,
    reset,
    isStreaming,
    errors,
  };
}
