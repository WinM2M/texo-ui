import { useMemo, useState } from 'react';
import type { DirectiveComponentProps } from '../../shared';
import { useDirectiveAction } from '../../shared';
import type { InteractiveChartAttributes } from './types';

function maxOf(values: number[]): number {
  return values.reduce((m, v) => (v > m ? v : m), 0) || 1;
}

export function InteractiveChart({
  attributes,
  onAction,
}: DirectiveComponentProps<InteractiveChartAttributes>): JSX.Element {
  const emit = useDirectiveAction(onAction);
  const [chartType, setChartType] = useState(attributes.type ?? 'bar');
  const dataset = attributes.data?.datasets?.[0];
  const labels = attributes.data?.labels ?? [];
  const values = dataset?.values ?? [];
  const max = useMemo(() => maxOf(values), [values]);

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
      <h3>{attributes.title ?? 'Interactive Chart'}</h3>
      <div style={{ display: 'flex', gap: 6 }}>
        {['bar', 'line', 'pie', 'donut'].map((type) => (
          <button key={type} type="button" onClick={() => setChartType(type as typeof chartType)}>
            {type}
          </button>
        ))}
      </div>
      {chartType === 'bar' || chartType === 'line' ? (
        <svg
          viewBox="0 0 520 220"
          style={{ width: '100%', background: '#f8fafc', borderRadius: 8 }}
        >
          {values.map((value, idx) => {
            const x = 20 + idx * 60;
            const h = (value / max) * 150;
            const y = 190 - h;
            return (
              <g key={`bar-${idx}`}>
                <rect
                  x={x}
                  y={chartType === 'bar' ? y : 188}
                  width={chartType === 'bar' ? 36 : 8}
                  height={chartType === 'bar' ? h : 2}
                  fill={dataset?.color ?? '#4f46e5'}
                  style={{ cursor: attributes.drilldown ? 'pointer' : 'default' }}
                  onClick={() =>
                    emit({
                      type: 'drilldown',
                      directive: 'interactive-chart',
                      value: { label: labels[idx], dataset: dataset?.label, value },
                    })
                  }
                />
                <text x={x} y={208} fontSize="10">
                  {labels[idx]}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <ul>
          {values.map((value, idx) => (
            <li key={`pie-${idx}`}>
              <button
                type="button"
                onClick={() =>
                  emit({
                    type: 'drilldown',
                    directive: 'interactive-chart',
                    value: { label: labels[idx], dataset: dataset?.label, value },
                  })
                }
              >
                {labels[idx]}: {value.toLocaleString()} {attributes.currency ?? ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
