import React from 'react';
import { useTexoContext } from '@texo-ui/react';

const shellStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 12,
  background: '#ffffff',
  color: '#0f172a',
  padding: 12,
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
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

export function TexoStack(props: Record<string, unknown>): React.ReactElement {
  const direction = props.direction === 'row' ? 'row' : 'column';
  const gap = asNumber(props.gap, 10);
  const title = asString(props.title);

  return (
    <section style={shellStyle}>
      {title ? <h3 style={{ margin: 0, marginBottom: 10 }}>{title}</h3> : null}
      <p style={{ margin: 0, color: '#6b7280' }}>
        Layout: {direction} / gap {gap}
      </p>
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
          gap: 8,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={`grid-cell-${index}`}
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 8,
              minHeight: 48,
              padding: 8,
              color: '#0f172a',
            }}
          >
            Cell {index + 1}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TexoButton(props: Record<string, unknown>): React.ReactElement {
  const { dispatch } = useTexoContext();
  const label = asString(props.label, 'Action');
  const action = asString(props.action, 'action');
  const variant =
    props.variant === 'secondary' || props.variant === 'ghost' ? props.variant : 'primary';
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: '#111827', color: '#ffffff', border: '1px solid #111827' },
    secondary: { background: '#ffffff', color: '#111827', border: '1px solid #111827' },
    ghost: { background: 'transparent', color: '#111827', border: '1px dashed #9ca3af' },
  };

  return (
    <button
      type="button"
      data-action={action}
      onClick={() => dispatch({ type: action, directive: 'texo-button', value: { label, action } })}
      style={{ borderRadius: 10, padding: '8px 12px', ...styles[variant] }}
    >
      {label}
    </button>
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
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      <input
        name={name}
        type={inputType}
        placeholder={placeholder}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '8px 10px',
          background: '#ffffff',
          color: '#0f172a',
        }}
      />
    </label>
  );
}

export function TexoTable(props: Record<string, unknown>): React.ReactElement {
  const columns = asStringArray(props.columns);
  const rows = asRecordArray(props.rows);

  return (
    <div style={{ overflowX: 'auto', color: '#0f172a', background: '#ffffff', borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{ textAlign: 'left', borderBottom: '1px solid #d1d5db', padding: 8 }}
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
                  style={{ borderBottom: '1px solid #e5e7eb', padding: 8 }}
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
  const labels = asStringArray(props.labels);
  const firstSeries = Array.isArray(props.series) ? props.series[0] : undefined;
  const values =
    firstSeries &&
    typeof firstSeries === 'object' &&
    Array.isArray((firstSeries as { values?: unknown }).values)
      ? (firstSeries as { values: unknown[] }).values.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value),
        )
      : [];
  const max = Math.max(...values, 1);

  return (
    <section style={shellStyle}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Chart ({chartType})</h3>
      <div style={{ display: 'grid', gap: 6 }}>
        {labels.map((label, index) => {
          const value = values[index] ?? 0;
          const width = `${Math.round((value / max) * 100)}%`;
          return (
            <div key={label} style={{ display: 'grid', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb' }}>
                <div style={{ height: 8, borderRadius: 999, background: '#2563eb', width }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
