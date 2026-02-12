import type { DashboardColumnType } from './types';

export function detectType(value: unknown): DashboardColumnType {
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value !== 'string') {
    return 'text';
  }
  if (/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(value)) {
    return 'image';
  }
  if (/^https?:\/\//i.test(value)) {
    return 'link';
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return 'date';
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return 'color';
  }
  if (value.length < 20) {
    return 'badge';
  }
  return 'text';
}
