export interface ChartDataset {
  label: string;
  values: number[];
  color?: string;
}

export interface InteractiveChartAttributes {
  title?: string;
  type?: 'bar' | 'line' | 'pie' | 'donut';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  drilldown?: boolean;
  currency?: string;
}
