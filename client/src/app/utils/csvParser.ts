export interface CsvData {
  headers: string[];
  rows: string[][];
  sheets?: { 
    name: string;
    headers: string[];
    rows: string[][];
  }[];
}

export const parseCsvPreview = (csvContent: string): CsvData => {
  // Split content into lines and remove empty lines at the end
  const lines = csvContent.split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse CSV line, handling quoted values with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    
    result.push(cell); // Add the last cell
    return result.map(cell => cell.trim());
  };

  // Check if this is a multi-sheet CSV (contains sheet markers)
  const sheetMarkerRegex = /^# Sheet: (.+)$/;
  const hasSheetMarkers = lines.some(line => sheetMarkerRegex.test(line.trim()));
  
  // If it doesn't have sheet markers, process as regular CSV
  if (!hasSheetMarkers) {
    // Filter empty lines
    const filteredLines = lines.filter(line => line.trim());
    if (filteredLines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Extract headers and data rows
    const headers = parseCSVLine(filteredLines[0]);
    const rows = filteredLines.slice(1).map(line => parseCSVLine(line));
    
    return { headers, rows };
  }
  
  // Process multi-sheet CSV
  const sheets: { name: string; headers: string[]; rows: string[][] }[] = [];
  let currentSheetName = '';
  let currentSheetLines: string[] = [];
  
  // Collect lines for each sheet
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.trim().match(sheetMarkerRegex);
    
    if (match) {
      // If we have collected lines for a previous sheet, process it
      if (currentSheetName && currentSheetLines.length > 0) {
        processCurrentSheet();
      }
      
      // Start a new sheet
      currentSheetName = match[1];
      currentSheetLines = [];
    } else if (currentSheetName && line.trim()) {
      // Add non-empty lines to the current sheet
      currentSheetLines.push(line);
    }
  }
  
  // Process the last sheet if there's any
  if (currentSheetName && currentSheetLines.length > 0) {
    processCurrentSheet();
  }
  
  // Function to process collected lines for a sheet
  function processCurrentSheet() {
    if (currentSheetLines.length === 0) return;
    
    const headers = parseCSVLine(currentSheetLines[0]);
    const rows = currentSheetLines.slice(1).map(line => parseCSVLine(line));
    
    sheets.push({
      name: currentSheetName,
      headers,
      rows
    });
  }
  
  // Return the first sheet as the main data, but include all sheets
  if (sheets.length === 0) {
    throw new Error('No valid data found in the CSV file');
  }
  
  return {
    headers: sheets[0].headers,
    rows: sheets[0].rows,
    sheets
  };
};
