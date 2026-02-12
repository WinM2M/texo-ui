export type DashboardColumnType =
  | 'text'
  | 'image'
  | 'link'
  | 'date'
  | 'color'
  | 'boolean'
  | 'number'
  | 'badge';

export interface DashboardColumn {
  field: string;
  type?: DashboardColumnType;
}

export interface AutoDashboardAttributes {
  title?: string;
  data: Array<Record<string, unknown>>;
  columns?: DashboardColumn[];
}
