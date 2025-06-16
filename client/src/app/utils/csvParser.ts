export interface CsvData {
  headers: string[];
  rows: string[][];
}

export const parseCsvPreview = (csvContent: string, maxRows: number = 5): CsvData => {
  // Split content into lines and remove empty lines
  const lines = csvContent.split('\n').filter(line => line.trim());
  
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
    
    // Add the last cell
    result.push(cell);
    
    return result.map(c => {
      // Remove quotes from quoted cells
      if (c.startsWith('"') && c.endsWith('"')) {
        return c.substring(1, c.length - 1);
      }
      return c.trim();
    });
  };

  // Get headers
  const headers = parseCSVLine(lines[0]);
  
  // Get preview rows
  const previewRows = lines
    .slice(1, maxRows + 1)
    .map(line => parseCSVLine(line));

  return {
    headers,
    rows: previewRows
  };
};
