import type { ASTNode, RecoveryEvent, RootNode } from '@texo-ui/core';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTexoAction } from '../hooks';
import { useTexoStream } from '../hooks/use-texo-stream';
import { injectBaseStyles } from '../styles/base-styles';
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
  errorResetKeys?: readonly unknown[];
  trimLeadingTextBeforeDirective?: boolean;
  renderDirectivesOnly?: boolean;
  showStreamingDirectives?: boolean;
  streamOptions?: UseTexoStreamOptions;
  className?: string;
  style?: React.CSSProperties;
  onAction?: (action: TexoAction) => void;
  onError?: (error: RecoveryEvent) => void;
  /**
   * Injects the baseline stylesheet into the document head once. Set false when you ship
   * your own styling for `.texo-*`, or when rendering into a shadow root that injects it
   * itself (as `@texo-ui/standalone` does).
   */
  injectBaseStyles?: boolean;
}

function trimLeadingNodesBeforeFirstDirective(root: RootNode): RootNode {
  const firstDirectiveIndex = root.children.findIndex((node: ASTNode) => node.type === 'directive');
  if (firstDirectiveIndex <= 0) {
    return root;
  }
  return {
    ...root,
    children: root.children.slice(firstDirectiveIndex),
  };
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
  const actionHandlerRef = useRef<TexoRendererProps['onAction']>(props.onAction);
  const errorHandlerRef = useRef<TexoRendererProps['onError']>(props.onError);
  const lastReportedErrorRef = useRef<RecoveryEvent | null>(null);

  useEffect(() => {
    if (props.injectBaseStyles === false) {
      return;
    }
    injectBaseStyles();
  }, [props.injectBaseStyles]);

  useEffect(() => {
    if (typeof props.content === 'string') {
      reset();
      push(props.content);
      end();
    }
  }, [props.content, push, end, reset]);

  useEffect(() => {
    actionHandlerRef.current = props.onAction;
  }, [props.onAction]);

  useEffect(() => {
    errorHandlerRef.current = props.onError;
  }, [props.onError]);

  useEffect(() => {
    if (actionHandlerRef.current) {
      return onAction((action) => {
        actionHandlerRef.current?.(action);
      });
    }
    return;
  }, [onAction]);

  useEffect(() => {
    if (errors.length === 0) {
      lastReportedErrorRef.current = null;
      return;
    }

    const latestError = errors[errors.length - 1];
    if (lastReportedErrorRef.current === latestError) {
      return;
    }
    lastReportedErrorRef.current = latestError;
    errorHandlerRef.current?.(latestError);
  }, [errors]);

  const resolvedAST = typeof props.content === 'string' || !props.content ? ast : props.content;
  const renderAST = props.trimLeadingTextBeforeDirective
    ? trimLeadingNodesBeforeFirstDirective(resolvedAST)
    : resolvedAST;
  if (renderAST.children.length > 0) {
    lastValidASTRef.current = renderAST;
  }

  return (
    <TexoErrorBoundary
      fallback={props.errorFallback}
      lastValidAST={lastValidASTRef.current}
      resetKeys={props.errorResetKeys ?? [props.content]}
    >
      <TexoContext.Provider value={{ registry, dispatch }}>
        <div className={props.className} style={props.style}>
          {reconcile(
            renderAST,
            registry,
            props.fallback,
            props.renderDirectivesOnly,
            props.showStreamingDirectives,
          )}
        </div>
      </TexoContext.Provider>
    </TexoErrorBoundary>
  );
}
