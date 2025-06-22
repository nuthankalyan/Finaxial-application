export interface MetricChange {
  value: number;
  positive: boolean;
}

export interface Metric {
  label: string;
  value: string | number;
  change?: MetricChange;
}

export type FinancialMetrics = Record<string, {
  current: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}>;
