import { useTexoContext } from '@texo-ui/react';

export interface TexoAction {
  type: string;
  directive: string;
  value: unknown;
}

export interface DirectiveComponentProps<T = Record<string, unknown>> {
  attributes: T;
  status: 'streaming' | 'complete';
  onAction?: (action: TexoAction) => void;
}

export function useDirectiveAction(
  onAction?: (action: TexoAction) => void,
): (action: TexoAction) => void {
  const { dispatch } = useTexoContext();
  return (action: TexoAction): void => {
    dispatch(action);
    onAction?.(action);
  };
}
