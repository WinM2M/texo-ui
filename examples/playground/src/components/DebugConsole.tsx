import type { RootNode, RecoveryEvent } from '@texo-ui/core';
import type { TexoAction } from '@texo-ui/react';

export function DebugConsole({
  ast,
  actions,
  errors,
  open,
  onToggle,
}: {
  ast: RootNode | null;
  actions: TexoAction[];
  errors: RecoveryEvent[];
  open: boolean;
  onToggle: () => void;
}): JSX.Element {
  return (
    <section className="debug-console">
      <button type="button" onClick={onToggle}>
        {open ? 'Hide Console' : 'Show Console'}
      </button>
      {open ? (
        <div className="debug-grid">
          <article>
            <h4>AST</h4>
            <pre>{ast ? JSON.stringify(ast, null, 2) : 'No AST yet'}</pre>
          </article>
          <article>
            <h4>Actions</h4>
            <pre>{actions.length ? JSON.stringify(actions, null, 2) : 'No action yet'}</pre>
          </article>
          <article>
            <h4>Recovery</h4>
            <pre>{errors.length ? JSON.stringify(errors, null, 2) : 'No recovery event'}</pre>
          </article>
        </div>
      ) : null}
    </section>
  );
}
