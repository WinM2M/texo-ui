import type { RootNode } from '@texo/core';
import React from 'react';

export interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  lastValidAST?: RootNode;
}

interface BoundaryState {
  error: Error | null;
}

const DefaultErrorFallback = ({ error, reset }: ErrorFallbackProps): React.ReactElement => {
  return (
    <div className="texo-error-boundary" role="alert">
      <p>Texo renderer failed: {error.message}</p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
};

export class TexoErrorBoundary extends React.Component<{
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error) => void;
  lastValidAST?: RootNode;
  children: React.ReactNode;
}> {
  state: BoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    const Fallback = this.props.fallback ?? DefaultErrorFallback;
    return (
      <Fallback
        error={this.state.error}
        reset={this.reset}
        lastValidAST={this.props.lastValidAST}
      />
    );
  }
}
