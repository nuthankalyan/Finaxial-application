import { HiddenColumnsMap } from '../types/hiddenColumns';

/**
 * Filter CSV content to exclude hidden columns
 * @param csvContent Original CSV content as string
 * @param hiddenColumns Map of hidden column indices
 * @param fileIndex Index of current file in the hiddenColumns map
 * @param sheetIndex Index of current sheet (default 0 for CSV)
 * @returns Filtered CSV content as string
 */
export function filterHiddenColumns(
  csvContent: string,
  hiddenColumns: HiddenColumnsMap,
  fileIndex: number,
  sheetIndex: number = 0
): string {
  // If no hiddenColumns data available, return original content
  if (!hiddenColumns || !hiddenColumns[fileIndex] || !hiddenColumns[fileIndex][sheetIndex]) {
    return csvContent;
  }

  const fileHiddenColumns = hiddenColumns[fileIndex][sheetIndex];
  
  // If no columns are hidden, return original content
  if (fileHiddenColumns.length === 0) {
    return csvContent;
  }

  // Split CSV content into rows
  const rows = csvContent.trim().split('\n');
  if (rows.length === 0) return csvContent;
  
  // For each row, filter out the hidden columns
  const processedRows = rows.map(row => {
    const columns = row.split(',');
    
    // Create a new row with only visible columns
    return columns
      .filter((_, colIndex) => !fileHiddenColumns.includes(colIndex))
      .join(',');
  });
  
  return processedRows.join('\n');
}

/**
 * Filter Excel JSON content to exclude hidden columns
 * @param excelJson Excel content as JSON string
 * @param hiddenColumns Map of hidden column indices
 * @param fileIndex Index of current file in the hiddenColumns map
 * @returns Filtered Excel JSON content as string
 */
export function filterHiddenColumnsExcel(
  excelJson: string,
  hiddenColumns: HiddenColumnsMap,
  fileIndex: number
): string {
  // If no hiddenColumns data available, return original content
  if (!hiddenColumns || !hiddenColumns[fileIndex]) {
    return excelJson;
  }

  try {
    const excelData = JSON.parse(excelJson);
    const sheetsData = excelData.sheets || {};
    const modifiedSheets: Record<string, any> = {};
    let anySheetModified = false;

    // Process each sheet
    Object.entries(sheetsData).forEach(([sheetName, sheetData]: [string, any], sheetIndex) => {
      const sheetHiddenColumns = hiddenColumns[fileIndex][sheetIndex] || [];
      
      // If no columns are hidden in this sheet, keep it as is
      if (sheetHiddenColumns.length === 0) {
        modifiedSheets[sheetName] = sheetData;
        return;
      }
      
      anySheetModified = true;
      const headers = sheetData.headers || [];
      const rows = sheetData.rows || [];
      
      // Filter out hidden columns
      const visibleColumnIndices = headers
        .map((_: any, idx: number) => idx)
        .filter((idx: number) => !sheetHiddenColumns.includes(idx));
      
      // Create new headers and rows arrays without hidden columns
      const filteredHeaders = visibleColumnIndices.map((idx: number) => headers[idx]);
      const filteredRows = rows.map((row: any[]) => 
        visibleColumnIndices.map((idx: number) => row[idx])
      );
      
      modifiedSheets[sheetName] = {
        headers: filteredHeaders,
        rows: filteredRows
      };
    });
    
    if (!anySheetModified) {
      return excelJson;
    }
    
    // Create new Excel data with filtered sheets
    const modifiedExcelData = {
      ...excelData,
      sheets: modifiedSheets
    };
    
    // If primary sheet has hidden columns, update primary data too
    if (modifiedSheets[excelData.primarySheet]) {
      modifiedExcelData.primaryData = {
        headers: modifiedSheets[excelData.primarySheet].headers,
        rows: modifiedSheets[excelData.primarySheet].rows
      };
    }
    
    return JSON.stringify(modifiedExcelData);
  } catch (error) {
    console.error("Error filtering Excel hidden columns:", error);
    return excelJson;
  }
}

/**
 * Process file content to filter out hidden columns based on file type
 * @param content File content as string
 * @param fileType 'csv' or 'excel'
 * @param hiddenColumns Map of hidden column indices
 * @param fileIndex Index of current file
 * @returns Processed content with hidden columns removed
 */
export function processFileContent(
  content: string,
  fileType: 'csv' | 'excel',
  hiddenColumns: HiddenColumnsMap,
  fileIndex: number
): string {
  if (fileType === 'csv') {
    return filterHiddenColumns(content, hiddenColumns, fileIndex);
  } else if (fileType === 'excel') {
    return filterHiddenColumnsExcel(content, hiddenColumns, fileIndex);
  }
  return content;
}

/**
 * Get hidden columns configuration from localStorage
 * @returns Hidden columns map or empty object if none found
 */
export function getHiddenColumnsFromStorage(): HiddenColumnsMap {
  try {
    const storedHiddenColumns = localStorage.getItem('hiddenColumns');
    return storedHiddenColumns ? JSON.parse(storedHiddenColumns) : {};
  } catch (error) {
    console.error("Error retrieving hidden columns from localStorage:", error);
    return {};
  }
}
