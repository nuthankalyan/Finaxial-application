// Types for tracking hidden columns in files

// Maps file indices to a map of sheet indices to arrays of hidden column indices
export interface HiddenColumnsMap {
  [fileIndex: number]: {
    [sheetIndex: number]: number[];
  };
}

// Represents file and sheet metadata for hidden columns
export interface FileColumnsVisibility {
  fileIndex: number;
  sheetIndex: number;
  hiddenColumns: number[];
}
