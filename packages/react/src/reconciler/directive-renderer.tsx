import type { ASTNode, DirectiveNode } from '@texo-ui/core';
import React from 'react';
import type { DirectiveRendererProps } from './types';

function isDirectiveNode(node: ASTNode): node is DirectiveNode {
  return node.type === 'directive';
}

export function DirectiveRenderer({
  node,
  registry,
  fallback,
}: DirectiveRendererProps): React.ReactElement {
  if (!isDirectiveNode(node)) {
    return <div className="texo-directive texo-directive--invalid" />;
  }

  const component = registry.get(node.name);
  const className = `texo-directive texo-directive--${node.name}${
    node.status === 'streaming' ? ' texo-directive--streaming' : ''
  }`;

  if (component) {
    const Component = component;
    return (
      <div className={className}>
        <Component {...node.attributes} />
      </div>
    );
  }

  if (fallback) {
    const Fallback = fallback;
    return (
      <div className={className}>
        <Fallback node={node} />
      </div>
    );
  }

  return (
    <div className={className}>
      <pre className="texo-directive-fallback">{node.rawBody}</pre>
      {node.status === 'streaming' ? (
        <span className="texo-directive-loading">Loading...</span>
      ) : null}
    </div>
  );
}
