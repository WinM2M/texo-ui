import { useMemo, useState } from 'react';
import type { DirectiveComponentProps } from '../../shared';
import { useDirectiveAction } from '../../shared';
import { detectType } from './TypeDetector';
import type { AutoDashboardAttributes, DashboardColumn } from './types';

function renderCell(value: unknown, type: string): JSX.Element {
  if (type === 'image') {
    return (
      <img src={String(value)} alt="thumb" style={{ width: 36, height: 36, borderRadius: 6 }} />
    );
  }
  if (type === 'link') {
    return (
      <a href={String(value)} target="_blank" rel="noreferrer">
        {String(value)}
      </a>
    );
  }
  if (type === 'date') {
    return <span>{new Date(String(value)).toLocaleDateString()}</span>;
  }
  if (type === 'color') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <i style={{ width: 14, height: 14, background: String(value), borderRadius: 4 }} />
        {String(value)}
      </span>
    );
  }
  if (type === 'boolean') {
    return <span>{value ? '✓' : '✗'}</span>;
  }
  if (type === 'badge') {
    return (
      <span style={{ background: '#eef2ff', borderRadius: 999, padding: '2px 8px' }}>
        {String(value)}
      </span>
    );
  }
  if (type === 'number') {
    return <span>{Number(value).toLocaleString()}</span>;
  }
  return <span>{String(value ?? '')}</span>;
}

export function AutoDashboard({
  attributes,
  onAction,
}: DirectiveComponentProps<AutoDashboardAttributes>): JSX.Element {
  const emit = useDirectiveAction(onAction);
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);

  const columns = useMemo<DashboardColumn[]>(() => {
    if (attributes.columns?.length) {
      return attributes.columns;
    }
    const row = attributes.data?.[0] ?? {};
    return Object.keys(row).map((field) => ({ field, type: detectType(row[field]) }));
  }, [attributes.columns, attributes.data]);

  const rows = useMemo(() => {
    const filtered = (attributes.data ?? []).filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
    );
    if (!sortField) {
      return filtered;
    }
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === bv) {
        return 0;
      }
      return av > bv ? (sortAsc ? 1 : -1) : sortAsc ? -1 : 1;
    });
  }, [attributes.data, query, sortAsc, sortField]);

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
      <h3>{attributes.title ?? 'Auto Dashboard'}</h3>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => {
                    setSortField(col.field);
                    setSortAsc((v) => !v);
                  }}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  {col.field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`row-${idx}`}
                onClick={() =>
                  emit({
                    type: 'row-select',
                    directive: 'auto-dashboard',
                    value: { id: row.id, data: row },
                  })
                }
              >
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col.field}`}
                    style={{ padding: 6, borderTop: '1px solid #eee' }}
                  >
                    {renderCell(row[col.field], col.type ?? detectType(row[col.field]))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
