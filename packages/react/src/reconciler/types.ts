import type { ASTNode } from '@texo/core';
import type React from 'react';
import type { ComponentRegistry } from '../registry';

export interface FallbackProps {
  node: ASTNode;
}

export interface DirectiveRendererProps {
  node: ASTNode;
  registry: ComponentRegistry;
  fallback?: React.ComponentType<FallbackProps>;
}

export interface NodeRendererProps {
  node: ASTNode;
  children?: React.ReactNode;
}
