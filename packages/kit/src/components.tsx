import React from 'react';
import { TexoContext } from '@texo-ui/react';

const shellStyle: React.CSSProperties = {
  border: 'var(--texo-theme-border, 1px solid var(--texo-theme-line, #d1d5db))',
  borderRadius: 'var(--texo-theme-radius, 12px)',
  background: 'var(--texo-theme-background, #ffffff)',
  color: 'var(--texo-theme-foreground, #0f172a)',
  paddingBlock: 'var(--texo-theme-paddingY, 10px)',
  paddingInline: 'var(--texo-theme-paddingX, 15px)',
  boxShadow: 'var(--texo-theme-shadow, 0 4px 12px rgba(15, 23, 42, 0.10))',
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
      )
    : [];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface ChartSeries {
  name: string;
  values: number[];
}

type SvgShapeType =
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'path'
  | 'polyline'
  | 'polygon'
  | 'text';

function parseChartSeries(value: unknown): ChartSeries[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
    )
    .map((entry, index) => {
      const source =
        Array.isArray(entry.values) && entry.values.length > 0
          ? entry.values
          : Array.isArray(entry.data)
            ? entry.data
            : [];
      return {
        name: asString(entry.name, `Series ${index + 1}`),
        values: source.filter(
          (point): point is number => typeof point === 'number' && Number.isFinite(point),
        ),
      };
    })
    .filter((series) => series.values.length > 0);
}

function normalizeSvgAttrKey(key: string): string {
  return key.replace(/-([a-z])/g, (_, alpha: string) => alpha.toUpperCase());
}

function toSvgPropValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function parseSvgShapeType(value: unknown): SvgShapeType | null {
  if (value === 'rect' || value === 'circle' || value === 'ellipse' || value === 'line') {
    return value;
  }
  if (value === 'path' || value === 'polyline' || value === 'polygon' || value === 'text') {
    return value;
  }
  return null;
}

function renderSvgShape(shape: Record<string, unknown>, index: number): React.ReactNode {
  const shapeType = parseSvgShapeType(shape.type);
  if (!shapeType) {
    return null;
  }

  const rawAttributes: Record<string, unknown> = isObject(shape.attrs) ? shape.attrs : shape;
  const attrs: Record<string, string | number | boolean> = { key: `shape-${index}` };
  Object.entries(rawAttributes).forEach(([key, value]) => {
    if (key === 'type' || key === 'attrs' || key === 'text') {
      return;
    }
    const parsed = toSvgPropValue(value);
    if (parsed === undefined) {
      return;
    }
    attrs[normalizeSvgAttrKey(key)] = parsed;
  });

  if (shapeType === 'text') {
    return React.createElement('text', attrs, asString(shape.text));
  }
  return React.createElement(shapeType, attrs);
}

function parseISODate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function addDaysISO(value: string, days: number): string {
  const parsed = parseISODate(value);
  if (!parsed) {
    return value;
  }
  parsed.setDate(parsed.getDate() + days);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TexoStack(props: Record<string, unknown>): React.ReactElement {
  const title = asString(props.title);

  if (!title) {
    return <></>;
  }

  return (
    <section style={shellStyle}>
      {title ? <h3 style={{ margin: 0, marginBottom: 10 }}>{title}</h3> : null}
    </section>
  );
}

export function TexoGrid(props: Record<string, unknown>): React.ReactElement {
  const columns = Math.max(1, Math.floor(asNumber(props.columns, 2)));
  const title = asString(props.title);
  return (
    <section style={shellStyle}>
      {title ? <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3> : null}
      <div
        style={{
          display: 'grid',
          gap: 'var(--texo-theme-grid-gap, 8px)',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={`grid-cell-${index}`}
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 'var(--texo-theme-radius, 8px)',
              minHeight: 48,
              padding: 'var(--texo-theme-cell-padding, 8px)',
              color: 'var(--texo-theme-foreground, #0f172a)',
            }}
          >
            Cell {index + 1}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TexoRect(props: Record<string, unknown>): React.ReactElement {
  const width = Math.max(40, asNumber(props.width, 220));
  const height = Math.max(24, asNumber(props.height, 120));
  const radius = Math.max(0, asNumber(props.radius, 8));
  const fill = asString(props.fill, 'var(--texo-theme-accent, #2563eb)');
  const stroke = asString(props.stroke, 'var(--texo-theme-line, #1e293b)');
  const strokeWidth = Math.max(0, asNumber(props.strokeWidth, 1));

  return (
    <section style={shellStyle}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: `${width}px`, display: 'block' }}
        role="img"
        aria-label="Rectangle"
      >
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={Math.max(0, width - strokeWidth)}
          height={Math.max(0, height - strokeWidth)}
          rx={radius}
          ry={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    </section>
  );
}

export function TexoSvg(props: Record<string, unknown>): React.ReactElement {
  const width = Math.max(40, asNumber(props.width, 320));
  const height = Math.max(24, asNumber(props.height, 180));
  const viewBox = asString(props.viewBox, `0 0 ${width} ${height}`);
  const background = asString(props.background);
  const shapes = asRecordArray(props.shapes);

  return (
    <section style={shellStyle}>
      <svg
        viewBox={viewBox}
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          minHeight: `${height}px`,
          display: 'block',
        }}
        role="img"
        aria-label="SVG"
      >
        {background ? <rect x={0} y={0} width="100%" height="100%" fill={background} /> : null}
        {shapes.map((shape, index) => renderSvgShape(shape, index))}
      </svg>
    </section>
  );
}

export function TexoButton(props: Record<string, unknown>): React.ReactElement {
  const texoContext = React.useContext(TexoContext);
  const componentId = asString(props.id);
  const label = asString(props.label, 'Action');
  const action = asString(props.action, 'action');
  const selected = asBoolean(props.selected, false);
  const stylePreset =
    props.stylePreset === 'compact' ||
    props.stylePreset === 'wide' ||
    props.stylePreset === 'raised' ||
    props.stylePreset === 'pill' ||
    props.stylePreset === 'flat' ||
    props.stylePreset === 'outline-bold'
      ? props.stylePreset
      : undefined;
  const variant =
    props.variant === 'secondary' || props.variant === 'ghost' ? props.variant : 'primary';
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--texo-theme-accent, #111827)',
      color: 'var(--texo-theme-on-accent, #ffffff)',
      border: '1px solid var(--texo-theme-accent, #111827)',
    },
    secondary: {
      background: 'var(--texo-theme-background, #ffffff)',
      color: 'var(--texo-theme-foreground, #111827)',
      border: '1px solid var(--texo-theme-line, #111827)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--texo-theme-foreground, #111827)',
      border: '1px dashed var(--texo-theme-line, #9ca3af)',
    },
  };

  const presetStyles: Record<string, React.CSSProperties> = {
    compact: { padding: '6px 10px', fontSize: 13, minHeight: 36 },
    wide: { width: '100%', minHeight: 56, fontSize: 18, fontWeight: 700 },
    raised: {
      width: '100%',
      minHeight: 56,
      boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)',
      fontSize: 17,
      fontWeight: 700,
    },
    pill: { borderRadius: 999, padding: '10px 16px', fontWeight: 600 },
    flat: { boxShadow: 'none', minHeight: 48 },
    'outline-bold': { borderWidth: 2, fontWeight: 700, minHeight: 48 },
  };

  return (
    <button
      type="button"
      data-action={action}
      onClick={() =>
        texoContext?.dispatch({
          type: action,
          directive: 'button',
          value: { label, action, componentId, selected },
        })
      }
      style={{
        borderRadius: 'var(--texo-theme-radius, 10px)',
        padding: '8px 12px',
        margin: 'var(--texo-theme-button-margin, 4px 0)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        minHeight: 48,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...styles[variant],
        ...(stylePreset ? presetStyles[stylePreset] : {}),
        ...(selected
          ? {
              boxShadow:
                '0 0 0 2px var(--texo-theme-accent, #2563eb), 0 10px 20px rgba(15, 23, 42, 0.18)',
              transform: 'translateY(-1px)',
            }
          : {
              opacity: 0.92,
            }),
      }}
      aria-pressed={selected}
      data-selected={selected ? 'true' : 'false'}
    >
      {label}
    </button>
  );
}

export function TexoCheckbox(props: Record<string, unknown>): React.ReactElement {
  const texoContext = React.useContext(TexoContext);
  const componentId = asString(props.id);
  const label = asString(props.label, 'Check');
  const name = asString(props.name, 'checkbox');
  const action = asString(props.action, `toggle-${name}`);
  const checked = Boolean(props.checked);

  return (
    <label
      style={{
        ...shellStyle,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        onChange={(event) => {
          texoContext?.dispatch({
            type: action,
            directive: 'checkbox',
            value: {
              label,
              name,
              checked: event.currentTarget.checked,
              componentId,
            },
          });
        }}
      />
      <span>{label}</span>
    </label>
  );
}

export function TexoInput(props: Record<string, unknown>): React.ReactElement {
  const label = asString(props.label, 'Field');
  const name = asString(props.name, 'field');
  const inputType =
    props.inputType === 'number' || props.inputType === 'email' || props.inputType === 'date'
      ? props.inputType
      : 'text';
  const placeholder = asString(props.placeholder);

  return (
    <label style={{ display: 'grid', gap: 6, minWidth: 0, width: '100%' }}>
      <span style={{ fontSize: 13, color: 'var(--texo-theme-foreground, #374151)' }}>{label}</span>
      <input
        name={name}
        type={inputType}
        placeholder={placeholder}
        style={{
          border: '1px solid var(--texo-theme-line, #d1d5db)',
          borderRadius: 'var(--texo-theme-radius, 8px)',
          padding: '8px 10px',
          background: 'var(--texo-theme-background, #ffffff)',
          color: 'var(--texo-theme-foreground, #0f172a)',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      />
    </label>
  );
}

export function TexoTable(props: Record<string, unknown>): React.ReactElement {
  const columns = asStringArray(props.columns);
  const rows = asRecordArray(props.rows);

  return (
    <div
      style={{
        overflowX: 'auto',
        color: 'var(--texo-theme-foreground, #0f172a)',
        background: 'var(--texo-theme-background, #ffffff)',
        borderRadius: 'var(--texo-theme-radius, 10px)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid var(--texo-theme-line, #d1d5db)',
                  padding: 8,
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`row-${index}`}>
              {columns.map((column) => (
                <td
                  key={`${index}-${column}`}
                  style={{ borderBottom: '1px solid var(--texo-theme-line, #e5e7eb)', padding: 8 }}
                >
                  {String(row[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TexoChart(props: Record<string, unknown>): React.ReactElement {
  const chartType =
    props.chartType === 'line' || props.chartType === 'pie' || props.chartType === 'donut'
      ? props.chartType
      : 'bar';
  const xEditable = asBoolean(props.xEditable, false);
  const initialMode =
    props.xAxisMode === 'index' || props.xAxisMode === 'date' || props.xAxisMode === 'label'
      ? props.xAxisMode
      : 'label';
  const sourceStartDate = asString(props.startDate, '2026-01-01');
  const [xAxisMode, setXAxisMode] = React.useState<'label' | 'index' | 'date'>(initialMode);
  const [rangeStartDate, setRangeStartDate] = React.useState(
    asString(props.rangeStartDate, sourceStartDate),
  );
  const [rangeEndDate, setRangeEndDate] = React.useState(
    asString(props.rangeEndDate, addDaysISO(sourceStartDate, 29)),
  );
  const [dayStep, setDayStep] = React.useState(Math.max(1, Math.floor(asNumber(props.dayStep, 1))));

  React.useEffect(() => {
    if (props.xAxisMode === 'index' || props.xAxisMode === 'date' || props.xAxisMode === 'label') {
      setXAxisMode(props.xAxisMode);
    }
    if (typeof props.rangeStartDate === 'string' && props.rangeStartDate.length > 0) {
      setRangeStartDate(props.rangeStartDate);
    } else if (typeof props.startDate === 'string' && props.startDate.length > 0) {
      setRangeStartDate(props.startDate);
    }
    if (typeof props.rangeEndDate === 'string' && props.rangeEndDate.length > 0) {
      setRangeEndDate(props.rangeEndDate);
    } else if (typeof props.startDate === 'string' && props.startDate.length > 0) {
      setRangeEndDate(addDaysISO(props.startDate, 29));
    }
    if (props.dayStep !== undefined) {
      setDayStep(Math.max(1, Math.floor(asNumber(props.dayStep, 1))));
    }
  }, [props.xAxisMode, props.startDate, props.rangeStartDate, props.rangeEndDate, props.dayStep]);

  const labels = asStringArray(props.labels);
  const sourceSeries = parseChartSeries(props.series);
  const series = sourceSeries.length > 0 ? sourceSeries : [{ name: 'Series 1', values: [] }];

  if (chartType === 'pie' || chartType === 'donut') {
    const palette = [
      'var(--texo-theme-accent, #2563eb)',
      '#0ea5e9',
      '#14b8a6',
      '#22c55e',
      '#f59e0b',
      '#ef4444',
    ];
    const pieLabels = series.length > 1 ? series.map((entry) => entry.name) : labels;
    const pieValues =
      series.length > 1
        ? series.map((entry) => entry.values[entry.values.length - 1] ?? 0)
        : series[0].values;
    const total = pieValues.reduce((sum, value) => sum + value, 0);
    const gradientStops = pieValues
      .map((value, index) => {
        const start = pieValues.slice(0, index).reduce((sum, current) => sum + current, 0);
        const startPct = total > 0 ? Math.round((start / total) * 100) : 0;
        const endPct = total > 0 ? Math.round(((start + value) / total) * 100) : 0;
        const color = palette[index % palette.length];
        return `${color} ${startPct}% ${endPct}%`;
      })
      .join(', ');
    const ringMask =
      chartType === 'donut'
        ? 'radial-gradient(circle at center, transparent 43%, #000 44%)'
        : undefined;
    const singleSeriesName = series.length === 1 ? series[0]?.name : '';

    return (
      <section style={shellStyle}>
        {singleSeriesName ? (
          <p
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 12,
              color: 'var(--texo-theme-muted, #6b7280)',
            }}
          >
            {singleSeriesName}
          </p>
        ) : null}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: gradientStops ? `conic-gradient(${gradientStops})` : '#e5e7eb',
              WebkitMaskImage: ringMask,
              maskImage: ringMask,
            }}
          />
          <div style={{ display: 'grid', gap: 6 }}>
            {pieLabels.map((label, index) => {
              const value = pieValues[index] ?? 0;
              const share = total > 0 ? Math.round((value / total) * 100) : 0;
              const color = palette[index % palette.length];
              return (
                <div
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span>
                    {value} ({share}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (chartType === 'line') {
    const maxLength = Math.max(...series.map((entry) => entry.values.length), 0);
    const sourceStart = parseISODate(sourceStartDate);
    const selectedStart = parseISODate(rangeStartDate);
    const selectedEnd = parseISODate(rangeEndDate);
    let visibleStartIndex = 0;
    let visibleEndIndex = Math.max(0, maxLength - 1);

    if (xAxisMode === 'date' && sourceStart && selectedStart) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const startDiffDays = Math.floor(
        (selectedStart.getTime() - sourceStart.getTime()) / msPerDay,
      );
      const endDiffDays = selectedEnd
        ? Math.floor((selectedEnd.getTime() - sourceStart.getTime()) / msPerDay)
        : startDiffDays + (maxLength - 1) * dayStep;

      const mappedStart = Math.floor(startDiffDays / dayStep);
      const mappedEnd = Math.floor(endDiffDays / dayStep);
      visibleStartIndex = Math.min(Math.max(mappedStart, 0), Math.max(0, maxLength - 1));
      visibleEndIndex = Math.min(
        Math.max(mappedEnd, visibleStartIndex),
        Math.max(0, maxLength - 1),
      );
    }

    const visibleLength = Math.max(0, visibleEndIndex - visibleStartIndex + 1);

    const chartLabels = Array.from({ length: visibleLength }, (_, offset) => {
      const index = visibleStartIndex + offset;
      if (xAxisMode === 'index') {
        return String(index + 1);
      }
      if (xAxisMode === 'date') {
        const base = parseISODate(sourceStartDate);
        if (!base) {
          return `D${index + 1}`;
        }
        base.setDate(base.getDate() + index * dayStep);
        const month = String(base.getMonth() + 1).padStart(2, '0');
        const day = String(base.getDate()).padStart(2, '0');
        return `${month}/${day}`;
      }
      return labels[index] ?? String(index + 1);
    });

    const slicedSeries = series.map((entry) => ({
      ...entry,
      values: entry.values.slice(visibleStartIndex, visibleEndIndex + 1),
    }));

    const allValues = slicedSeries.flatMap((entry) => entry.values);
    const min = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
    const range = Math.max(maxValue - min, 1);
    const width = 640;
    const height = 260;
    const left = 44;
    const right = 14;
    const top = 18;
    const bottom = 36;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const palette = ['#60a5fa', '#22c55e', '#f59e0b', '#e11d48', '#7c3aed'];
    const lineSeries = slicedSeries.map((entry, seriesIndex) => {
      const points = entry.values.map((value, index) => {
        const x =
          visibleLength > 1
            ? left + (index / (visibleLength - 1)) * plotWidth
            : left + plotWidth / 2;
        const y = top + ((maxValue - value) / range) * plotHeight;
        return { x, y, value };
      });

      const linePath = points
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
        )
        .join(' ');

      return {
        name: entry.name,
        values: entry.values,
        color: palette[seriesIndex % palette.length],
        points,
        linePath,
      };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = maxValue - ratio * range;
      const y = top + ratio * plotHeight;
      return { value, y };
    });

    const xTickStep = Math.max(1, Math.ceil(chartLabels.length / 8));
    const xTicks = chartLabels
      .map((label, index) => ({ label, index }))
      .filter((entry, idx) => idx % xTickStep === 0 || idx === chartLabels.length - 1)
      .map((entry) => ({
        label: entry.label,
        x:
          visibleLength > 1
            ? left + (entry.index / (visibleLength - 1)) * plotWidth
            : left + plotWidth / 2,
      }));

    return (
      <section style={shellStyle}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%' }}
          role="img"
          aria-label="Line chart"
        >
          {yTicks.map((tick) => (
            <g key={`y-${tick.y}`}>
              <line
                x1={left}
                y1={tick.y}
                x2={left + plotWidth}
                y2={tick.y}
                stroke="var(--texo-theme-line, #334155)"
                strokeWidth="1"
                opacity="0.35"
              />
              <text
                x={left - 6}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--texo-theme-foreground, #e2e8f0)"
                opacity="0.8"
              >
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <text
              key={`x-${tick.label}-${tick.x}`}
              x={tick.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="var(--texo-theme-foreground, #e2e8f0)"
              opacity="0.8"
            >
              {tick.label}
            </text>
          ))}
          {lineSeries.map((entry) =>
            entry.linePath ? (
              <path
                key={`line-${entry.name}`}
                d={entry.linePath}
                fill="none"
                stroke={entry.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null,
          )}
          {lineSeries.map((entry) =>
            entry.points.map((point, index) => {
              const isEdge = index === 0 || index === entry.points.length - 1;
              const isMajor = index % xTickStep === 0;
              if (!isEdge && !isMajor) {
                return null;
              }
              return (
                <circle
                  key={`dot-${entry.name}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={isEdge ? 3.5 : 2.5}
                  fill={entry.color}
                  stroke="var(--texo-theme-background, #0b1220)"
                  strokeWidth="1.5"
                />
              );
            }),
          )}
        </svg>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {lineSeries.map((entry) => (
            <span
              key={`legend-${entry.name}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                border: '1px solid var(--texo-theme-line, #334155)',
                borderRadius: 999,
                padding: '4px 8px',
              }}
            >
              <i style={{ width: 10, height: 10, borderRadius: 999, background: entry.color }} />
              {entry.name}
            </span>
          ))}
        </div>

        {xEditable ? (
          <div
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 8,
            }}
          >
            <label style={{ display: 'grid', gap: 4, fontSize: 12, minWidth: 0 }}>
              X Axis
              <select
                value={xAxisMode}
                onChange={(event) => setXAxisMode(event.target.value as 'label' | 'index' | 'date')}
                style={{
                  border: '1px solid var(--texo-theme-line, #334155)',
                  borderRadius: 'var(--texo-theme-radius, 8px)',
                  background: 'var(--texo-theme-background, #ffffff)',
                  color: 'var(--texo-theme-foreground, #0f172a)',
                  padding: '6px 8px',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <option value="label">Label</option>
                <option value="index">Index</option>
                <option value="date">Date</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12, minWidth: 0 }}>
              Start Date
              <input
                type="date"
                value={rangeStartDate}
                onChange={(event) => setRangeStartDate(event.target.value)}
                disabled={xAxisMode !== 'date'}
                style={{
                  border: '1px solid var(--texo-theme-line, #334155)',
                  borderRadius: 'var(--texo-theme-radius, 8px)',
                  background: 'var(--texo-theme-background, #ffffff)',
                  color: 'var(--texo-theme-foreground, #0f172a)',
                  padding: '6px 8px',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12, minWidth: 0 }}>
              End Date
              <input
                type="date"
                value={rangeEndDate}
                onChange={(event) => setRangeEndDate(event.target.value)}
                disabled={xAxisMode !== 'date'}
                style={{
                  border: '1px solid var(--texo-theme-line, #334155)',
                  borderRadius: 'var(--texo-theme-radius, 8px)',
                  background: 'var(--texo-theme-background, #ffffff)',
                  color: 'var(--texo-theme-foreground, #0f172a)',
                  padding: '6px 8px',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12, minWidth: 0 }}>
              Day Step
              <input
                type="number"
                min={1}
                step={1}
                value={dayStep}
                onChange={(event) =>
                  setDayStep(Math.max(1, Math.floor(Number(event.target.value) || 1)))
                }
                disabled={xAxisMode !== 'date'}
                style={{
                  border: '1px solid var(--texo-theme-line, #334155)',
                  borderRadius: 'var(--texo-theme-radius, 8px)',
                  background: 'var(--texo-theme-background, #ffffff)',
                  color: 'var(--texo-theme-foreground, #0f172a)',
                  padding: '6px 8px',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              />
            </label>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {lineSeries.map((entry) => {
            const first = entry.values[0] ?? 0;
            const last = entry.values[entry.values.length - 1] ?? 0;
            const delta = last - first;
            const deltaSign = delta >= 0 ? '+' : '';
            return (
              <div
                key={`summary-${entry.name}`}
                style={{
                  border: '1px solid var(--texo-theme-line, #334155)',
                  borderRadius: 'var(--texo-theme-radius, 10px)',
                  padding: 8,
                  fontSize: 12,
                }}
              >
                <strong>{entry.name}</strong>
                <div>Latest {last.toFixed(1)}%</div>
                <div>
                  Delta {deltaSign}
                  {delta.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section style={shellStyle}>
      <div style={{ display: 'grid', gap: 6 }}>
        {(series[0]?.values ?? []).map((value, index) => {
          const label = labels[index] ?? String(index + 1);
          const max = Math.max(...(series[0]?.values ?? [1]), 1);
          const width = `${Math.round((value / max) * 100)}%`;
          return (
            <div key={label} style={{ display: 'grid', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--texo-theme-line, #e5e7eb)',
                }}
              >
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: 'var(--texo-theme-accent, #2563eb)',
                    width,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
