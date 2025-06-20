import * as xlsx from 'xlsx';

export interface SheetData {
  headers: string[];
  rows: string[][];
}

export interface ExcelData {
  sheets: {
    [sheetName: string]: SheetData;
  };
  primarySheet: string; // Name of the first sheet (for backward compatibility)
}

export const parseExcelFile = (data: ArrayBuffer): ExcelData => {
  // Read the Excel file
  const workbook = xlsx.read(data, { type: 'array' });
  
  if (workbook.SheetNames.length === 0) {
    throw new Error('Excel file contains no sheets');
  }
  
  const primarySheet = workbook.SheetNames[0];
  const sheets: { [sheetName: string]: SheetData } = {};
  
  // Process all sheets in the workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the worksheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length === 0) {
      // Skip empty sheets but don't throw error
      sheets[sheetName] = { headers: [], rows: [] };
      continue;
    }
    
    // Extract headers and rows
    const headers = jsonData[0].map(header => String(header || ''));
    const rows = jsonData.slice(1).map(row => 
      // Ensure all cells are strings
      row.map(cell => cell !== undefined && cell !== null ? String(cell) : '')
    );
    
    sheets[sheetName] = { headers, rows };
  }
  
  return { sheets, primarySheet };
};
