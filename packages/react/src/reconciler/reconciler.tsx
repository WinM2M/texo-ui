import { TEXO_THEME_PRESETS, type ASTNode, type DirectiveNode, type RootNode } from '@texo-ui/core';
import React from 'react';
import { defaultRenderers, hasChildren } from './default-renderers';
import { DirectiveRenderer } from './directive-renderer';
import type { ComponentRegistry } from '../registry';
import type { FallbackProps } from './types';

type ThemeTokens = Record<string, string>;

interface GridCellDef {
  id: string;
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  mountAliases?: string[];
}

interface GridEntry {
  kind: 'grid';
  key: string;
  id: string;
  rows: number;
  columns: number;
  cells: GridCellDef[];
  mountedByCellId: Map<string, MountedNodeEntry[]>;
  theme: ThemeTokens;
}

interface NodeEntry {
  kind: 'node';
  key: string;
  node: React.ReactNode;
}

interface MountedNodeEntry {
  key: string;
  node: React.ReactNode;
  uiId?: string;
}

type RootEntry = GridEntry | NodeEntry;

function isDirectiveNode(node: ASTNode): node is DirectiveNode {
  return node.type === 'directive';
}

function directiveNameMatches(name: string, target: string): boolean {
  return name === target || name === `texo-${target}`;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.floor(parsed));
    }
  }
  return fallback;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function parseGridCoordinate(value: unknown): { row: number; column: number } | null {
  const raw = asString(value);
  if (!raw) {
    return null;
  }
  const match = /^(\d+)\s*:\s*(\d+)$/.exec(raw);
  if (!match) {
    return null;
  }
  return {
    row: Number(match[1]),
    column: Number(match[2]),
  };
}

function parseGridSpan(value: unknown): { rowSpan: number; columnSpan: number } | null {
  const raw = asString(value);
  if (!raw) {
    return null;
  }
  const match = /^(\d+)\s*x\s*(\d+)$/i.exec(raw);
  if (!match) {
    return null;
  }
  return {
    rowSpan: Number(match[1]),
    columnSpan: Number(match[2]),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeTheme(base: ThemeTokens, next: ThemeTokens): ThemeTokens {
  return { ...base, ...next };
}

function shouldUsePixelUnit(tokenKey: string): boolean {
  const normalized = tokenKey.toLowerCase();
  return (
    normalized === 'radius' ||
    normalized === 'paddingx' ||
    normalized === 'paddingy' ||
    normalized.endsWith('radius') ||
    normalized.endsWith('padding') ||
    normalized.endsWith('gap') ||
    normalized.endsWith('width') ||
    normalized.endsWith('height') ||
    normalized.endsWith('size') ||
    normalized.endsWith('margin')
  );
}

function serializeThemeToken(tokenKey: string, value: string | number): string {
  if (typeof value === 'string') {
    return value;
  }
  return shouldUsePixelUnit(tokenKey) ? `${value}px` : String(value);
}

function parseThemeTokens(attributes: Record<string, unknown>): ThemeTokens {
  const reserved = new Set([
    'scope',
    'mount',
    'target',
    'targetMount',
    'grid',
    'targetGrid',
    'tokens',
  ]);
  const tokens: ThemeTokens = {};
  const preset = asString(attributes.preset);

  if (preset && TEXO_THEME_PRESETS[preset]) {
    Object.assign(tokens, TEXO_THEME_PRESETS[preset]);
  }

  if (isObject(attributes.tokens)) {
    Object.entries(attributes.tokens).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 0) {
        tokens[key] = serializeThemeToken(key, value);
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        tokens[key] = serializeThemeToken(key, value);
      }
    });
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (reserved.has(key)) {
      return;
    }
    if (typeof value === 'string' && value.length > 0) {
      tokens[key] = serializeThemeToken(key, value);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      tokens[key] = serializeThemeToken(key, value);
    }
  });

  return tokens;
}

function themeToStyle(tokens: ThemeTokens): React.CSSProperties {
  const style: React.CSSProperties & Record<string, string> = {};
  Object.entries(tokens).forEach(([key, value]) => {
    style[`--texo-theme-${key}`] = value;
  });

  if (tokens.foreground) {
    style.color = tokens.foreground;
  }
  return style;
}

function parseGridCells(
  gridId: string,
  attributes: Record<string, unknown>,
  rows: number,
  columns: number,
): GridCellDef[] {
  const generated: GridCellDef[] = [];
  const byCoord = new Map<string, GridCellDef>();
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const generatedId = `${gridId}/${row}:${column}`;
      const cell: GridCellDef = {
        id: generatedId,
        row,
        column,
        rowSpan: 1,
        columnSpan: 1,
        mountAliases: [generatedId],
      };
      generated.push(cell);
      byCoord.set(`${row}:${column}`, cell);
    }
  }

  const cells = attributes.cells;
  if (Array.isArray(cells) && cells.length > 0) {
    const rawCoords = cells
      .map((entry) => {
        if (!isObject(entry)) {
          return null;
        }
        return {
          row: asFiniteNumber(entry.row),
          column: asFiniteNumber(entry.column),
        };
      })
      .filter(
        (entry): entry is { row: number | undefined; column: number | undefined } => entry !== null,
      );

    const hasZeroRow = rawCoords.some((entry) => entry.row === 0);
    const hasZeroColumn = rawCoords.some((entry) => entry.column === 0);

    cells.forEach((entry, index) => {
      if (!isObject(entry)) {
        return;
      }
      const fallbackRow = Math.floor(index / columns) + 1;
      const fallbackColumn = (index % columns) + 1;
      const compactAt = parseGridCoordinate(entry.at);
      const explicitRow = asFiniteNumber(entry.row) ?? compactAt?.row;
      const explicitColumn = asFiniteNumber(entry.column) ?? compactAt?.column;
      const row =
        explicitRow !== undefined
          ? hasZeroRow
            ? Math.floor(explicitRow) + 1
            : Math.floor(explicitRow)
          : fallbackRow;
      const column =
        explicitColumn !== undefined
          ? hasZeroColumn
            ? Math.floor(explicitColumn) + 1
            : Math.floor(explicitColumn)
          : fallbackColumn;
      const safeRow = Math.min(Math.max(row, 1), rows);
      const safeColumn = Math.min(Math.max(column, 1), columns);
      const key = `${safeRow}:${safeColumn}`;
      const targetCell = byCoord.get(key);
      if (!targetCell) {
        return;
      }

      const compactSpan = parseGridSpan(entry.span);
      targetCell.rowSpan = asNumber(entry.rowSpan, compactSpan?.rowSpan ?? targetCell.rowSpan);
      targetCell.columnSpan = asNumber(
        entry.columnSpan ?? entry.colSpan,
        compactSpan?.columnSpan ?? targetCell.columnSpan,
      );

      const customId = asString(entry.id);
      if (customId && customId !== targetCell.id) {
        targetCell.mountAliases = Array.from(
          new Set([...(targetCell.mountAliases ?? []), customId, `${gridId}:${customId}`]),
        );
      }
    });
  }

  return generated;
}

function withTheme(node: React.ReactNode, key: string, theme: ThemeTokens): React.ReactNode {
  if (Object.keys(theme).length === 0) {
    return node;
  }
  return (
    <div key={key} style={themeToStyle(theme)}>
      {node}
    </div>
  );
}

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

function shouldRenderDirectiveNode(
  node: DirectiveNode,
  registry: ComponentRegistry,
  directivesOnly?: boolean,
): boolean {
  if (!directivesOnly) {
    return true;
  }
  return registry.get(node.name) !== undefined;
}

function renderGridEntry(entry: GridEntry): React.ReactNode {
  return (
    <section
      key={entry.key}
      className="texo-grid-layout"
      style={{
        ...themeToStyle(entry.theme),
        display: 'grid',
        gap: 'var(--texo-theme-grid-gap, 12px)',
        gridTemplateColumns: `repeat(${entry.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${entry.rows}, minmax(var(--texo-theme-grid-row-min-height, 64px), auto))`,
        margin: 'var(--texo-theme-grid-margin, 0.75em 0)',
        width: '100%',
      }}
    >
      {entry.cells.map((cell) => {
        const mounted = entry.mountedByCellId.get(cell.id) ?? [];
        return (
          <div
            key={`${entry.key}-${cell.id}`}
            data-texo-cell-id={cell.id}
            style={{
              gridColumn: `${cell.column} / span ${cell.columnSpan}`,
              gridRow: `${cell.row} / span ${cell.rowSpan}`,
              minHeight: 'var(--texo-theme-grid-cell-min-height, 64px)',
              minWidth: 0,
            }}
          >
            {mounted.map((item) => (
              <React.Fragment key={item.key}>{item.node}</React.Fragment>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function renderRootWithMounting(
  ast: RootNode,
  registry: ComponentRegistry,
  fallback?: React.ComponentType<FallbackProps>,
  directivesOnly?: boolean,
  showStreamingDirectives?: boolean,
): React.ReactNode {
  const entries: RootEntry[] = [];
  const gridById = new Map<string, GridEntry>();
  const cellToGrid = new Map<string, { grid: GridEntry; cellId: string }>();
  const rootNodeIndexByUiId = new Map<string, number>();
  const mountedUiPlacement = new Map<string, { grid: GridEntry; cellId: string }>();
  const localThemeByMount = new Map<string, ThemeTokens>();
  const localThemeByGrid = new Map<string, ThemeTokens>();

  let globalTheme: ThemeTokens = {};
  let pendingLocalTheme: ThemeTokens | null = null;
  let gridCount = 0;

  const consumePendingTheme = (): ThemeTokens => {
    if (!pendingLocalTheme) {
      return {};
    }
    const theme = pendingLocalTheme;
    pendingLocalTheme = null;
    return theme;
  };

  const reindexRootUiMapFrom = (start: number): void => {
    if (start < 0) {
      return;
    }
    for (let index = start; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry.kind !== 'node') {
        continue;
      }
      for (const [uiId, mappedIndex] of rootNodeIndexByUiId.entries()) {
        if (mappedIndex === index) {
          rootNodeIndexByUiId.set(uiId, index);
        }
      }
    }
  };

  const removeRootNodeByUiId = (uiId: string): void => {
    const index = rootNodeIndexByUiId.get(uiId);
    if (index === undefined) {
      return;
    }
    entries.splice(index, 1);
    rootNodeIndexByUiId.delete(uiId);
    for (const [key, mappedIndex] of rootNodeIndexByUiId.entries()) {
      if (mappedIndex > index) {
        rootNodeIndexByUiId.set(key, mappedIndex - 1);
      }
    }
  };

  const removeMountedNodeByUiId = (uiId: string): void => {
    const placement = mountedUiPlacement.get(uiId);
    if (!placement) {
      return;
    }
    const current = placement.grid.mountedByCellId.get(placement.cellId) ?? [];
    placement.grid.mountedByCellId.set(
      placement.cellId,
      current.filter((item) => item.uiId !== uiId),
    );
    mountedUiPlacement.delete(uiId);
  };

  const clearExistingUiPlacement = (uiId?: string): void => {
    if (!uiId) {
      return;
    }
    removeRootNodeByUiId(uiId);
    removeMountedNodeByUiId(uiId);
  };

  ast.children.forEach((node) => {
    if (node.type === 'newline') {
      return;
    }

    if (directivesOnly && !isDirectiveNode(node)) {
      return;
    }

    if (isDirectiveNode(node) && node.status === 'streaming' && !showStreamingDirectives) {
      consumePendingTheme();
      return;
    }

    if (isDirectiveNode(node) && directiveNameMatches(node.name, 'theme')) {
      const scope = asString(node.attributes.scope) === 'local' ? 'local' : 'global';
      const tokens = parseThemeTokens(node.attributes);

      if (scope === 'global') {
        globalTheme = mergeTheme(globalTheme, tokens);
      } else {
        const mountTarget =
          asString(node.attributes.mount) ??
          asString(node.attributes.targetMount) ??
          asString(node.attributes.target);
        const gridTarget = asString(node.attributes.grid) ?? asString(node.attributes.targetGrid);

        if (mountTarget) {
          localThemeByMount.set(
            mountTarget,
            mergeTheme(localThemeByMount.get(mountTarget) ?? {}, tokens),
          );
        } else if (gridTarget) {
          localThemeByGrid.set(
            gridTarget,
            mergeTheme(localThemeByGrid.get(gridTarget) ?? {}, tokens),
          );
        } else {
          pendingLocalTheme = mergeTheme(pendingLocalTheme ?? {}, tokens);
        }
      }
      return;
    }

    if (isDirectiveNode(node) && directiveNameMatches(node.name, 'grid')) {
      gridCount += 1;
      const rows = asNumber(node.attributes.rows, 1);
      const columns = asNumber(node.attributes.columns, 2);
      const gridId = asString(node.attributes.id) ?? `grid-${gridCount}`;
      const cells = parseGridCells(gridId, node.attributes, rows, columns);
      const mountedByCellId = new Map<string, MountedNodeEntry[]>();
      cells.forEach((cell) => {
        mountedByCellId.set(cell.id, []);
      });

      const gridTheme = mergeTheme(consumePendingTheme(), localThemeByGrid.get(gridId) ?? {});

      const entry: GridEntry = {
        kind: 'grid',
        key: node.id,
        id: gridId,
        rows,
        columns,
        cells,
        mountedByCellId,
        theme: gridTheme,
      };

      entries.push(entry);
      gridById.set(gridId, entry);
      cells.forEach((cell) => {
        const aliases = new Set([cell.id, `${gridId}:${cell.id}`, ...(cell.mountAliases ?? [])]);
        aliases.forEach((alias) => {
          cellToGrid.set(alias, { grid: entry, cellId: cell.id });
        });
      });
      return;
    }

    if (isDirectiveNode(node)) {
      if (!shouldRenderDirectiveNode(node, registry, directivesOnly)) {
        consumePendingTheme();
        return;
      }

      const mountTarget = asString(node.attributes.mount);
      const uiId = asString(node.attributes.id);
      clearExistingUiPlacement(uiId);
      const nextTheme = mergeTheme(
        consumePendingTheme(),
        mountTarget ? (localThemeByMount.get(mountTarget) ?? {}) : {},
      );

      const renderedDirective = withTheme(
        <DirectiveRenderer key={node.id} node={node} registry={registry} fallback={fallback} />,
        `${node.id}-themed`,
        nextTheme,
      );

      if (mountTarget) {
        const directGrid = gridById.get(mountTarget);
        if (directGrid && directGrid.cells.length > 0) {
          const firstCell = directGrid.cells[0].id;
          const mounted = directGrid.mountedByCellId.get(firstCell) ?? [];
          mounted.push({ key: node.id, node: renderedDirective, uiId });
          directGrid.mountedByCellId.set(firstCell, mounted);
          if (uiId) {
            mountedUiPlacement.set(uiId, { grid: directGrid, cellId: firstCell });
          }
          return;
        }

        const mountedTarget = cellToGrid.get(mountTarget);
        if (mountedTarget) {
          const mounted = mountedTarget.grid.mountedByCellId.get(mountedTarget.cellId) ?? [];
          mounted.push({ key: node.id, node: renderedDirective, uiId });
          mountedTarget.grid.mountedByCellId.set(mountedTarget.cellId, mounted);
          if (uiId) {
            mountedUiPlacement.set(uiId, {
              grid: mountedTarget.grid,
              cellId: mountedTarget.cellId,
            });
          }
          return;
        }
      }

      entries.push({ kind: 'node', key: node.id, node: renderedDirective });
      if (uiId) {
        rootNodeIndexByUiId.set(uiId, entries.length - 1);
      }
      return;
    }

    const nextTheme = consumePendingTheme();
    const renderedNode = withTheme(
      renderNode(node, registry, fallback),
      `${node.id}-node-theme`,
      nextTheme,
    );
    entries.push({ kind: 'node', key: node.id, node: renderedNode });
  });

  return (
    <div className="texo-root" style={themeToStyle(globalTheme)}>
      {entries.map((entry) => {
        if (entry.kind === 'grid') {
          return renderGridEntry(entry);
        }
        return <React.Fragment key={entry.key}>{entry.node}</React.Fragment>;
      })}
    </div>
  );
}

export function reconcile(
  ast: RootNode,
  registry: ComponentRegistry,
  fallback?: React.ComponentType<FallbackProps>,
  directivesOnly?: boolean,
  showStreamingDirectives?: boolean,
): React.ReactNode {
  return renderRootWithMounting(ast, registry, fallback, directivesOnly, showStreamingDirectives);
}
