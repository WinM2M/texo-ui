import type { ASTNode, RootNode } from '@texo-ui/core';
import React from 'react';
import { defaultRenderers, hasChildren } from './default-renderers';
import { DirectiveRenderer } from './directive-renderer';
import type { ComponentRegistry } from '../registry';
import type { FallbackProps } from './types';

function renderNode(
  node: ASTNode,
  registry: ComponentRegistry,
  fallback?: React.ComponentType<FallbackProps>,
): React.ReactNode {
  if (node.type === 'directive') {
    return <DirectiveRenderer key={node.id} node={node} registry={registry} fallback={fallback} />;
  }

  const Renderer = defaultRenderers[node.type];
  const children = hasChildren(node)
    ? node.children?.map((child) => renderNode(child, registry, fallback))
    : undefined;

  return (
    <Renderer key={node.id} node={node}>
      {children}
    </Renderer>
  );
}

export function reconcile(
  ast: RootNode,
  registry: ComponentRegistry,
  fallback?: React.ComponentType<FallbackProps>,
): React.ReactNode {
  return renderNode(ast, registry, fallback);
}
