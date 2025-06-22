export interface TableColumn {
  header: string;
  accessor: string;
  isNumeric?: boolean;
  isCurrency?: boolean;
}

export interface BaseTableRow {
  isTotal?: boolean;
  isSubTotal?: boolean;
  isHeader?: boolean;
}

export interface TableRow extends BaseTableRow {
  [key: string]: string | number | boolean | null | undefined;
}
