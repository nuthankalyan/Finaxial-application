export interface CsvData {
  headers: string[];
  rows: string[][];
}

export interface SummaryTable {
  id: string;
  title: string;
  description: string;
  columns: import('./tables').TableColumn[];
  data: import('./tables').TableRow[];
}
