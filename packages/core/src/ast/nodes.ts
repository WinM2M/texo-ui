import type { Position } from '../types';

export type SourcePosition = Position;

export interface ASTNode {
  id: string;
  type: ASTNodeType;
  children?: ASTNode[];
  position?: SourcePosition;
}

export type ASTNodeType =
  | 'root'
  | 'paragraph'
  | 'heading'
  | 'text'
  | 'bold'
  | 'italic'
  | 'code-inline'
  | 'code-block'
  | 'list'
  | 'list-item'
  | 'blockquote'
  | 'link'
  | 'image'
  | 'hr'
  | 'directive'
  | 'newline';

export interface RootNode extends ASTNode {
  type: 'root';
  children: ASTNode[];
}

export interface TextNode extends ASTNode {
  type: 'text';
  value: string;
}

export interface ParagraphNode extends ASTNode {
  type: 'paragraph';
  children: ASTNode[];
}

export interface HeadingNode extends ASTNode {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: ASTNode[];
}

export interface CodeBlockNode extends ASTNode {
  type: 'code-block';
  language?: string;
  code: string;
}

export interface ListNode extends ASTNode {
  type: 'list';
  ordered: boolean;
  children: ASTNode[];
}

export interface ListItemNode extends ASTNode {
  type: 'list-item';
  children: ASTNode[];
}

export interface BlockquoteNode extends ASTNode {
  type: 'blockquote';
  children: ASTNode[];
}

export interface LinkNode extends ASTNode {
  type: 'link';
  url: string;
  title?: string;
  children: ASTNode[];
}

export interface ImageNode extends ASTNode {
  type: 'image';
  src: string;
  alt?: string;
}

export interface DirectiveNode extends ASTNode {
  type: 'directive';
  name: string;
  attributes: Record<string, unknown>;
  rawBody: string;
  status: 'streaming' | 'complete' | 'error';
}
