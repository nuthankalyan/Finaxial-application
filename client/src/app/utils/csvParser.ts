export interface CsvData {
  headers: string[];
  rows: string[][];
}

export const parseCsvPreview = (csvContent: string): CsvData => {
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
    
    result.push(cell); // Add the last cell
    return result.map(cell => cell.trim());
  };

  // Extract headers and data rows
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));

  return { headers, rows };
};
