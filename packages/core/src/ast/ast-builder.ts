import YAML from 'yaml';
import type { ParserEvent } from '../types';
import { parseCodeFence } from '../parser/tokenizers/code-block';
import { parseDirectiveHeader } from '../parser/tokenizers/directive';
import { parseHeading } from '../parser/tokenizers/heading';
import { DeterministicIdGenerator } from './id-generator';
import type {
  ASTNode,
  BlockquoteNode,
  CodeBlockNode,
  DirectiveNode,
  HeadingNode,
  ImageNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  RootNode,
  TextNode,
} from './nodes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneNode<T extends ASTNode>(node: T): T {
  const clonedChildren = node.children?.map((child) => cloneNode(child));
  return {
    ...node,
    children: clonedChildren,
  } as T;
}

function parseInlineToken(token: ParserEvent, id: string): ASTNode {
  switch (token.type) {
    case 'bold':
    case 'italic':
    case 'code-inline': {
      return {
        id,
        type: token.type,
        position: token.position,
        children: [
          {
            id: `${id}-text`,
            type: 'text',
            value: token.raw,
            position: token.position,
          } as TextNode,
        ],
      };
    }
    case 'link': {
      const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token.raw);
      const label = match?.[1] ?? token.raw;
      const url = match?.[2] ?? '';
      const node: LinkNode = {
        id,
        type: 'link',
        url,
        position: token.position,
        children: [
          {
            id: `${id}-text`,
            type: 'text',
            value: label,
            position: token.position,
          } as TextNode,
        ],
      };
      return node;
    }
    case 'image': {
      const match = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token.raw);
      const node: ImageNode = {
        id,
        type: 'image',
        src: match?.[2] ?? '',
        alt: match?.[1],
        position: token.position,
      };
      return node;
    }
    default: {
      const textNode: TextNode = {
        id,
        type: 'text',
        value: token.raw,
        position: token.position,
      };
      return textNode;
    }
  }
}

interface StreamingDirectiveState {
  node: DirectiveNode;
  lastValidBodyAttributes: Record<string, unknown>;
}

export class ASTBuilder {
  private root: RootNode;
  private idGenerator = new DeterministicIdGenerator();
  private dirtyIds = new Set<string>();
  private inlineTarget: ASTNode | null = null;
  private activeList: ListNode | null = null;
  private activeCodeBlock: CodeBlockNode | null = null;
  private activeDirective: StreamingDirectiveState | null = null;

  constructor() {
    this.root = {
      id: this.idGenerator.next('root'),
      type: 'root',
      children: [],
    };
  }

  addToken(token: ParserEvent): void {
    switch (token.type) {
      case 'paragraph':
        this.createParagraph(token);
        return;
      case 'heading':
        this.createHeading(token);
        return;
      case 'list-item':
        this.createListItem(token);
        return;
      case 'blockquote':
        this.createBlockquote(token);
        return;
      case 'text':
      case 'bold':
      case 'italic':
      case 'code-inline':
      case 'link':
      case 'image':
        this.appendInlineNode(token);
        return;
      case 'hr':
        this.appendRootNode({
          id: this.idGenerator.next('hr'),
          type: 'hr',
          position: token.position,
        });
        return;
      case 'newline':
        this.inlineTarget = null;
        this.activeList = null;
        this.appendRootNode({
          id: this.idGenerator.next('newline'),
          type: 'newline',
          position: token.position,
        });
        return;
      case 'code-block-start':
        this.startCodeBlock(token);
        return;
      case 'code-block-content':
        this.extendCodeBlock(token);
        return;
      case 'code-block-end':
        this.finishCodeBlock();
        return;
      case 'directive-open':
        this.openDirective(token);
        return;
      case 'directive-body':
        this.extendDirective(token);
        return;
      case 'directive-close':
        this.closeDirective();
        return;
      default:
        return;
    }
  }

  getTree(): RootNode {
    return cloneNode(this.root);
  }

  getDirtyNodes(): ASTNode[] {
    const dirty: ASTNode[] = [];
    const targetIds = new Set(this.dirtyIds);

    const visit = (node: ASTNode): void => {
      if (targetIds.has(node.id)) {
        dirty.push(cloneNode(node));
      }
      node.children?.forEach((child) => visit(child));
    };

    visit(this.root);
    return dirty;
  }

  clearDirtyNodes(): void {
    this.dirtyIds.clear();
  }

  hasStreamingDirectives(): boolean {
    return this.activeDirective !== null;
  }

  reset(): void {
    this.idGenerator.reset();
    this.root = {
      id: this.idGenerator.next('root'),
      type: 'root',
      children: [],
    };
    this.inlineTarget = null;
    this.activeList = null;
    this.activeCodeBlock = null;
    this.activeDirective = null;
    this.dirtyIds.clear();
  }

  private appendRootNode(node: ASTNode): void {
    this.root.children.push(node);
    this.dirtyIds.add(node.id);
  }

  private createParagraph(token: ParserEvent): void {
    this.activeList = null;
    const paragraph: ParagraphNode = {
      id: this.idGenerator.next('paragraph'),
      type: 'paragraph',
      position: token.position,
      children: [],
    };
    this.appendRootNode(paragraph);
    this.inlineTarget = paragraph;
  }

  private createHeading(token: ParserEvent): void {
    this.activeList = null;
    const parsed = parseHeading(token.raw);
    const depth = (parsed?.depth ?? 1) as HeadingNode['depth'];
    const heading: HeadingNode = {
      id: this.idGenerator.next('heading'),
      type: 'heading',
      depth,
      position: token.position,
      children: [],
    };
    this.appendRootNode(heading);
    this.inlineTarget = heading;
  }

  private createListItem(token: ParserEvent): void {
    const ordered = /^\s*\d+\.\s+/.test(token.raw);
    if (!this.activeList || this.activeList.ordered !== ordered) {
      this.activeList = {
        id: this.idGenerator.next('list'),
        type: 'list',
        ordered,
        position: token.position,
        children: [],
      };
      this.appendRootNode(this.activeList);
    }

    const item: ListItemNode = {
      id: this.idGenerator.next('list-item'),
      type: 'list-item',
      position: token.position,
      children: [],
    };
    this.activeList.children.push(item);
    this.dirtyIds.add(this.activeList.id);
    this.dirtyIds.add(item.id);
    this.inlineTarget = item;
  }

  private createBlockquote(token: ParserEvent): void {
    this.activeList = null;
    const quote: BlockquoteNode = {
      id: this.idGenerator.next('blockquote'),
      type: 'blockquote',
      position: token.position,
      children: [],
    };
    this.appendRootNode(quote);
    this.inlineTarget = quote;
  }

  private appendInlineNode(token: ParserEvent): void {
    if (!this.inlineTarget) {
      const paragraph: ParagraphNode = {
        id: this.idGenerator.next('paragraph'),
        type: 'paragraph',
        position: token.position,
        children: [],
      };
      this.appendRootNode(paragraph);
      this.inlineTarget = paragraph;
    }

    if (!this.inlineTarget.children) {
      this.inlineTarget.children = [];
    }

    const typeForId = this.inlineTypeForToken(token);
    const inlineNode = parseInlineToken(token, this.idGenerator.next(typeForId));
    this.inlineTarget.children.push(inlineNode);
    this.dirtyIds.add(this.inlineTarget.id);
    this.dirtyIds.add(inlineNode.id);
  }

  private startCodeBlock(token: ParserEvent): void {
    this.inlineTarget = null;
    this.activeList = null;
    const language = parseCodeFence(token.raw)?.language;
    const codeBlock: CodeBlockNode = {
      id: this.idGenerator.next('code-block'),
      type: 'code-block',
      position: token.position,
      language,
      code: '',
    };
    this.appendRootNode(codeBlock);
    this.activeCodeBlock = codeBlock;
  }

  private extendCodeBlock(token: ParserEvent): void {
    if (!this.activeCodeBlock) {
      this.startCodeBlock(token);
    }
    if (!this.activeCodeBlock) {
      return;
    }

    this.activeCodeBlock.code =
      this.activeCodeBlock.code.length > 0
        ? `${this.activeCodeBlock.code}\n${token.raw}`
        : token.raw;
    this.dirtyIds.add(this.activeCodeBlock.id);
  }

  private finishCodeBlock(): void {
    this.activeCodeBlock = null;
  }

  private inlineTypeForToken(
    token: ParserEvent,
  ): 'text' | 'bold' | 'italic' | 'code-inline' | 'link' | 'image' {
    if (
      token.type === 'text' ||
      token.type === 'bold' ||
      token.type === 'italic' ||
      token.type === 'code-inline' ||
      token.type === 'link' ||
      token.type === 'image'
    ) {
      return token.type;
    }
    return 'text';
  }

  private openDirective(token: ParserEvent): void {
    this.inlineTarget = null;
    this.activeList = null;

    const header = parseDirectiveHeader(token.raw);
    const directive: DirectiveNode = {
      id: this.idGenerator.next('directive'),
      type: 'directive',
      position: token.position,
      name: header?.name ?? 'unknown',
      attributes: header?.inlineAttributes ?? {},
      rawBody: '',
      status: 'streaming',
    };

    this.appendRootNode(directive);
    this.activeDirective = {
      node: directive,
      lastValidBodyAttributes: {},
    };
  }

  private extendDirective(token: ParserEvent): void {
    if (!this.activeDirective) {
      return;
    }

    const directive = this.activeDirective.node;
    directive.rawBody =
      directive.rawBody.length > 0 ? `${directive.rawBody}\n${token.raw}` : token.raw;

    const yamlResult = this.tryParseDirectiveBody(directive.rawBody);
    if (yamlResult) {
      this.activeDirective.lastValidBodyAttributes = yamlResult;
    }

    directive.attributes = {
      ...directive.attributes,
      ...this.activeDirective.lastValidBodyAttributes,
    };
    this.dirtyIds.add(directive.id);
  }

  private closeDirective(): void {
    if (!this.activeDirective) {
      return;
    }

    this.activeDirective.node.status = 'complete';
    this.dirtyIds.add(this.activeDirective.node.id);
    this.activeDirective = null;
  }

  private tryParseDirectiveBody(rawBody: string): Record<string, unknown> | null {
    try {
      const parsed = YAML.parse(rawBody);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
