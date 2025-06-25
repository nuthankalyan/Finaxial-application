export interface ChangeMetadata {
  addedRows: number;
  removedRows: number;
  modifiedRows: number;
  addedColumns: string[];
  removedColumns: string[];
  modifiedColumns: string[];
  changeDescription?: string;
  rowCount: number;
  columnCount: number;
}

export interface DatasetMetadata {
  columnCount: number;
  rowCount: number;
  headers: string[];
  sheets?: string[];
  dataTypes?: { [column: string]: string };
}

export interface DatasetVersion {
  _id: string;
  id?: string;
  version: number;
  fileName: string;
  originalFileName: string;
  createdAt: string;
  uploadedAt: string;
  userId: string;
  content: string;
  type: 'csv' | 'excel';
  metadata: DatasetMetadata;
  changeMetadata?: ChangeMetadata;
  parentVersionId?: string;
  fileSize: number;
}

export interface Dataset {
  id: string;
  name: string;
  currentVersion: number;
  versions: DatasetVersion[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  description?: string;
}

export interface DatasetResponse {
  dataset: Dataset;
  isNewDataset: boolean;
  version: number;
}
