import { useEffect, useMemo, useState } from 'react';
import {
  DataAdapter,
  GoogleDriveDriver,
  LocalStorageDriver,
  StorageError,
  StorageErrorCode,
  type StorageItem,
} from '@texo-ui/data-adapter';
import type { DirectiveComponentProps } from '../../shared';
import { useDirectiveAction } from '../../shared';
import type { ExpenseListAttributes } from './types';

type ExpenseData = Record<string, unknown>;

export function ExpenseList({
  attributes,
  onAction,
}: DirectiveComponentProps<ExpenseListAttributes>): JSX.Element {
  const emit = useDirectiveAction(onAction);
  const [adapter] = useState(() => new DataAdapter());
  const [items, setItems] = useState<Array<StorageItem<ExpenseData>>>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<ExpenseData>({});

  const source = attributes.source ?? 'local-storage';
  const collection = attributes.collection ?? 'expenses';
  const columns = attributes.columns ?? [];

  const refresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const next = await adapter.list<ExpenseData>(collection);
      setItems(next);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setup = async (): Promise<void> => {
      adapter.registerDriver(new LocalStorageDriver());
      if (source === 'google-drive') {
        const clientId =
          (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env
            ?.VITE_GOOGLE_CLIENT_ID ?? '';
        adapter.registerDriver(new GoogleDriveDriver({ auth: { clientId } }));
      }

      try {
        await adapter.use(source);
      } catch (e) {
        const err = e instanceof StorageError ? e : null;
        if (err?.code === StorageErrorCode.AUTH_REQUIRED && source === 'google-drive') {
          setError('Google Drive auth required. Provide valid clientId in app config.');
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to initialize storage');
        return;
      }

      await refresh();
    };

    void setup();
  }, [adapter, collection, source]);

  const addItem = async (): Promise<void> => {
    await adapter.create(collection, draft);
    setDraft({});
    await refresh();
    emit({ type: 'expense-create', directive: 'expense-list', value: draft });
  };

  const removeItem = async (id: string): Promise<void> => {
    await adapter.delete(collection, id);
    await refresh();
    emit({ type: 'expense-delete', directive: 'expense-list', value: { id } });
  };

  const summary = useMemo(() => {
    const amountValues = items.map((item) => Number(item.data.amount ?? 0));
    const sum = amountValues.reduce((a, b) => a + b, 0);
    const avg = amountValues.length ? sum / amountValues.length : 0;
    return { sum, avg };
  }, [items]);

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
      <h3>{attributes.title ?? 'Expense List'}</h3>
      <p>Source: {source}</p>
      {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, 1fr)`,
          gap: 8,
        }}
      >
        {columns.map((column) => (
          <input
            key={column.field}
            placeholder={column.label}
            value={String(draft[column.field] ?? '')}
            onChange={(e) => setDraft((prev) => ({ ...prev, [column.field]: e.target.value }))}
          />
        ))}
      </div>
      <button type="button" onClick={() => void addItem()} style={{ marginTop: 10 }}>
        Add Expense
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={`head-${column.field}`} style={{ textAlign: 'left' }}>
                {column.label}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {columns.map((column) => (
                <td
                  key={`${item.id}-${column.field}`}
                  style={{ borderTop: '1px solid #eee', padding: 6 }}
                >
                  {String(item.data[column.field] ?? '')}
                </td>
              ))}
              <td>
                <button type="button" onClick={() => void removeItem(item.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        <strong>Sum: {summary.sum.toLocaleString()}</strong>
        <strong>Avg: {summary.avg.toFixed(2)}</strong>
      </div>
    </section>
  );
}
