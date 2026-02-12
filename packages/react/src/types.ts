import type { RecoveryEvent, RecoveryConfig, RootNode } from '@texo-ui/core';

export interface TexoAction {
  type: string;
  directive: string;
  value: unknown;
}

export interface UseTexoStreamOptions {
  initialContent?: string;
  recovery?: Partial<RecoveryConfig>;
}

export interface UseTexoStreamReturn {
  ast: RootNode;
  push: (chunk: string) => void;
  end: () => void;
  reset: () => void;
  isStreaming: boolean;
  errors: RecoveryEvent[];
}
