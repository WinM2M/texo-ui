export interface ExpenseColumn {
  field: string;
  label: string;
  type?: 'date' | 'select' | 'number' | 'text';
  options?: string[];
}

export interface ExpenseSummaryRule {
  type: 'sum' | 'average';
  field: string;
  label: string;
}

export interface ExpenseListAttributes {
  title?: string;
  source?: 'local-storage' | 'google-drive';
  collection?: string;
  columns?: ExpenseColumn[];
  summary?: ExpenseSummaryRule[];
}
