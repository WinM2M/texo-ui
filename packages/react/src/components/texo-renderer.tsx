import type { RecoveryEvent, RootNode } from '@texo-ui/core';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTexoAction } from '../hooks';
import { useTexoStream } from '../hooks/use-texo-stream';
import { createRegistry, type ComponentRegistry } from '../registry';
import { reconcile } from '../reconciler';
import type { FallbackProps } from '../reconciler/types';
import { TexoContext } from '../context';
import { TexoErrorBoundary, type ErrorFallbackProps } from './texo-error-boundary';
import type { TexoAction, UseTexoStreamOptions } from '../types';

type RegistryInput =
  | ComponentRegistry
  | Record<string, React.ComponentType<Record<string, unknown>>>;

function isComponentRegistry(input: RegistryInput): input is ComponentRegistry {
  return (
    typeof (input as ComponentRegistry).get === 'function' &&
    typeof (input as ComponentRegistry).register === 'function'
  );
}

export interface TexoRendererProps {
  content?: string | RootNode;
  registry?: RegistryInput;
  fallback?: React.ComponentType<FallbackProps>;
  errorFallback?: React.ComponentType<ErrorFallbackProps>;
  streamOptions?: UseTexoStreamOptions;
  className?: string;
  style?: React.CSSProperties;
  onAction?: (action: TexoAction) => void;
  onError?: (error: RecoveryEvent) => void;
}

function resolveRegistry(input?: RegistryInput): ComponentRegistry {
  if (!input) {
    return createRegistry();
  }
  if (isComponentRegistry(input)) {
    return input;
  }
  return createRegistry(input);
}

export function TexoRenderer(props: TexoRendererProps): React.ReactElement {
  const { ast, push, end, reset, errors } = useTexoStream(props.streamOptions);
  const { dispatch, onAction } = useTexoAction();
  const registry = useMemo(() => resolveRegistry(props.registry), [props.registry]);
  const lastValidASTRef = useRef<RootNode | undefined>(undefined);

  useEffect(() => {
    if (typeof props.content === 'string') {
      reset();
      push(props.content);
      end();
    }
  }, [props.content, push, end, reset]);

  useEffect(() => {
    if (props.onAction) {
      return onAction(props.onAction);
    }
    return;
  }, [onAction, props.onAction]);

  useEffect(() => {
    if (errors.length > 0 && props.onError) {
      props.onError(errors[errors.length - 1]);
    }
  }, [errors, props.onError]);

  const resolvedAST = typeof props.content === 'string' || !props.content ? ast : props.content;
  if (resolvedAST.children.length > 0) {
    lastValidASTRef.current = resolvedAST;
  }

  return (
    <TexoErrorBoundary fallback={props.errorFallback} lastValidAST={lastValidASTRef.current}>
      <TexoContext.Provider value={{ registry, dispatch }}>
        <div className={props.className} style={props.style}>
          {reconcile(resolvedAST, registry, props.fallback)}
        </div>
      </TexoContext.Provider>
    </TexoErrorBoundary>
  );
}
