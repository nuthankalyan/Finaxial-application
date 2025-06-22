import type { FinancialMetrics } from './metrics';
import type { SummaryTable } from './csv';

export interface BalanceSheetData {
  assets: Record<string, number>;
  liabilities: Record<string, number>;
  equity: Record<string, number>;
}

export interface FinancialTrend {
  period: string;
  metrics: Record<string, number>;
}

export interface Insight {
  key: string;
  value: string;
  trend?: 'positive' | 'negative' | 'neutral';
}

export interface DynamicReportData {
  fileContents: string;
  financialMetrics?: FinancialMetrics;
  cashFlow?: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
  };
  profitLoss?: {
    revenue: number;
    expenses: number;
    grossProfit: number;
    netIncome: number;
  };
  balanceSheet?: BalanceSheetData;
  trends?: FinancialTrend[];
  insights?: Insight[];
}

export interface ProcessedReportData {
  tables: SummaryTable[];
  insights: string[];
  recommendations: string[];
  trends: FinancialTrend[];
}

export interface WorkspaceData {
  fileContents: string;
}
