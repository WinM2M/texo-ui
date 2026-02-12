import type {
  ASTNode,
  ASTNodeType,
  CodeBlockNode,
  HeadingNode,
  ImageNode,
  LinkNode,
  ListNode,
  TextNode,
} from '@texo-ui/core';
import React from 'react';
import type { NodeRendererProps } from './types';

const TextRenderer = React.memo(function TextRenderer({
  node,
}: NodeRendererProps): React.ReactNode {
  const textNode = node as TextNode;
  return textNode.value;
});

const ParagraphRenderer = React.memo(function ParagraphRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <p className="texo-paragraph">{children}</p>;
});

const HeadingRenderer = React.memo(function HeadingRenderer({
  node,
  children,
}: NodeRendererProps): React.ReactElement {
  const heading = node as HeadingNode;
  const Tag = `h${heading.depth}` as keyof React.JSX.IntrinsicElements;
  return <Tag className="texo-heading">{children}</Tag>;
});

const BoldRenderer = React.memo(function BoldRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <strong className="texo-bold">{children}</strong>;
});

const ItalicRenderer = React.memo(function ItalicRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <em className="texo-italic">{children}</em>;
});

const CodeInlineRenderer = React.memo(function CodeInlineRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <code className="texo-code-inline">{children}</code>;
});

const CodeBlockRenderer = React.memo(function CodeBlockRenderer({
  node,
}: NodeRendererProps): React.ReactElement {
  const codeNode = node as CodeBlockNode;
  const languageClass = codeNode.language ? `language-${codeNode.language}` : undefined;
  return (
    <pre className="texo-code-block">
      <code className={languageClass}>{codeNode.code}</code>
    </pre>
  );
});

const ListRenderer = React.memo(function ListRenderer({
  node,
  children,
}: NodeRendererProps): React.ReactElement {
  const list = node as ListNode;
  if (list.ordered) {
    return <ol className="texo-list texo-list--ordered">{children}</ol>;
  }
  return <ul className="texo-list texo-list--unordered">{children}</ul>;
});

const ListItemRenderer = React.memo(function ListItemRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <li className="texo-list-item">{children}</li>;
});

const BlockquoteRenderer = React.memo(function BlockquoteRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <blockquote className="texo-blockquote">{children}</blockquote>;
});

const LinkRenderer = React.memo(function LinkRenderer({
  node,
  children,
}: NodeRendererProps): React.ReactElement {
  const link = node as LinkNode;
  return (
    <a className="texo-link" href={link.url} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
});

const ImageRenderer = React.memo(function ImageRenderer({
  node,
}: NodeRendererProps): React.ReactElement {
  const image = node as ImageNode;
  return <img className="texo-image" src={image.src} alt={image.alt ?? ''} />;
});

const HrRenderer = React.memo(function HrRenderer(): React.ReactElement {
  return <hr className="texo-hr" />;
});

const NewlineRenderer = React.memo(function NewlineRenderer(): React.ReactElement {
  return <br className="texo-newline" />;
});

const RootRenderer = React.memo(function RootRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <div className="texo-root">{children}</div>;
});

const PassThroughRenderer = React.memo(function PassThroughRenderer({
  children,
}: NodeRendererProps): React.ReactElement {
  return <>{children}</>;
});

export const defaultRenderers: Record<ASTNodeType, React.ComponentType<NodeRendererProps>> = {
  root: RootRenderer,
  paragraph: ParagraphRenderer,
  heading: HeadingRenderer,
  text: TextRenderer as React.ComponentType<NodeRendererProps>,
  bold: BoldRenderer,
  italic: ItalicRenderer,
  'code-inline': CodeInlineRenderer,
  'code-block': CodeBlockRenderer,
  list: ListRenderer,
  'list-item': ListItemRenderer,
  blockquote: BlockquoteRenderer,
  link: LinkRenderer,
  image: ImageRenderer,
  hr: HrRenderer,
  directive: PassThroughRenderer,
  newline: NewlineRenderer,
};

export function hasChildren(node: ASTNode): boolean {
  return Array.isArray(node.children) && node.children.length > 0;
}
