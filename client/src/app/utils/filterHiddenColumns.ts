/**
 * Utility functions for filtering out hidden columns from CSV and Excel data
 */
import { HiddenColumnsMap } from '../types/hiddenColumns';

/**
 * Filter out hidden columns from CSV content
 * @param csvContent Original CSV content string
 * @param hiddenColumns Map of hidden column indices
 * @param fileIndex Index of the file in the hidden columns map
 * @param sheetIndex Sheet index (typically 0 for CSV files)
 * @returns Filtered CSV content as string
 */
export const filterCsvContent = (
  csvContent: string,
  hiddenColumns: HiddenColumnsMap,
  fileIndex: number,
  sheetIndex: number = 0
): string => {
  // Get hidden columns for this file/sheet
  const fileHiddenColumns = hiddenColumns[fileIndex]?.[sheetIndex] || [];
  
  // If no hidden columns, return the original content
  if (fileHiddenColumns.length === 0) {
    return csvContent;
  }
  
  // Parse the CSV content
  const rows = csvContent.trim().split('\n');
  
  // Process each row to filter out hidden columns
  return rows
    .map(row => {
      const columns = row.split(',');
      
      // Keep only visible columns
      return columns
        .filter((_, index) => !fileHiddenColumns.includes(index))
        .join(',');
    })
    .join('\n');
};

/**
 * Filter out hidden columns from Excel data in JSON format
 * @param excelContent Excel content as a JSON string
 * @param hiddenColumns Map of hidden column indices
 * @param fileIndex Index of the file in the hidden columns map
 * @returns Filtered Excel content as JSON string
 */
export const filterExcelContent = (
  excelContent: string,
  hiddenColumns: HiddenColumnsMap,
  fileIndex: number
): string => {
  // Parse Excel JSON data
  const excelData = JSON.parse(excelContent);
  
  // Process each sheet in the Excel data
  const filteredSheets: Record<string, any> = {};
  
  Object.entries(excelData.sheets).forEach(([name, sheetData]: [string, any], sheetIndex) => {
    // Get hidden columns for this sheet
    const sheetHiddenColumns = hiddenColumns[fileIndex]?.[sheetIndex] || [];
    
    // If no hidden columns for this sheet, keep it as is
    if (sheetHiddenColumns.length === 0) {
      filteredSheets[name] = sheetData;
      return;
    }
    
    // Filter out hidden columns from headers and rows
    const visibleHeaderIndices = sheetData.headers
      .map((_: any, index: number) => index)
      .filter((index: number) => !sheetHiddenColumns.includes(index));
    
    const filteredHeaders = visibleHeaderIndices.map((index: number) => sheetData.headers[index]);    const filteredRows = sheetData.rows.map((row: any[]) => 
      visibleHeaderIndices.map((index: number) => row[index])
    );
    
    // Add filtered sheet data
    filteredSheets[name] = {
      headers: filteredHeaders,
      rows: filteredRows
    };
  });
  
  // Rebuild the Excel data object
  const filteredExcelData = {
    ...excelData,
    sheets: filteredSheets
  };
  
  // If the primary sheet had hidden columns, we need to update its data
  const primarySheetIndex = Object.keys(excelData.sheets).findIndex(
    name => name === excelData.primarySheet
  );
  
  if (
    primarySheetIndex !== -1 && 
    hiddenColumns[fileIndex]?.[primarySheetIndex]?.length > 0
  ) {
    // Get the updated primary sheet data
    filteredExcelData.primaryData = {
      headers: filteredSheets[excelData.primarySheet].headers,
      rows: filteredSheets[excelData.primarySheet].rows
    };
  }
  
  return JSON.stringify(filteredExcelData);
};

/**
 * Filter hidden columns from file content based on file type
 */
export const filterFileContent = (
  content: string,
  fileType: 'csv' | 'excel',
  hiddenColumns: HiddenColumnsMap,
  fileIndex: number,
  sheetIndex: number = 0
): string => {
  if (fileType === 'csv') {
    return filterCsvContent(content, hiddenColumns, fileIndex, sheetIndex);
  } else if (fileType === 'excel') {
    return filterExcelContent(content, hiddenColumns, fileIndex);
  }
  return content;
};

/**
 * Get hidden columns data from localStorage
 */
export const getHiddenColumnsFromStorage = (): HiddenColumnsMap => {
  try {
    const storedHiddenColumns = localStorage.getItem('hiddenColumns');
    return storedHiddenColumns ? JSON.parse(storedHiddenColumns) : {};
  } catch (e) {
    console.error('Error parsing hidden columns from localStorage:', e);
    return {};
  }
};
