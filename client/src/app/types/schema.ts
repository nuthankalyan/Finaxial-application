export interface TableField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: {
    table: string;
    field: string;
  };
}

export interface TableSchema {
  name: string;
  fields: TableField[];
}
