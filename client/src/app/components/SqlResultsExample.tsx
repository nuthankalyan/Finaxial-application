'use client';

import React, { useState } from 'react';
import SqlResultsTable from './SqlResultsTable';
import SqlCodeBlock from './SqlCodeBlock';

const SqlResultsExample: React.FC = () => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [tableInput, setTableInput] = useState('');
  const [formattedData, setFormattedData] = useState<{headers: string[], rows: any[][]} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputFormat, setInputFormat] = useState<'markdown' | 'csv' | 'auto'>('auto');

  // Parse markdown table into structured data
  const parseMarkdownTable = (tableText: string): { headers: string[], rows: any[][] } | null => {
    try {
      const lines = tableText.trim().split('\n');
      if (lines.length < 3) {
        setError('Table must have at least a header row, separator row, and one data row');
        return null;
      }
      
      // Extract headers from the first line
      const headerLine = lines[0].trim();
      if (!headerLine.startsWith('|') || !headerLine.endsWith('|')) {
        setError('Header row must start and end with |');
        return null;
      }
      
      const headers = headerLine
        .split('|')
        .slice(1, -1) // Remove empty elements from start/end
        .map(header => header.trim());
      
      // Verify separator line (second line)
      const separatorLine = lines[1].trim();
      if (!separatorLine.startsWith('|') || !separatorLine.endsWith('|')) {
        setError('Separator row must start and end with |');
        return null;
      }
      if (!separatorLine.includes('-')) {
        setError('Separator row must contain dashes (-)');
        return null;
      }
      
      // Extract data rows
      const rows = lines.slice(2).map(line => {
        if (!line.trim()) return null; // Skip empty lines
        if (!line.trim().startsWith('|') || !line.trim().endsWith('|')) {
          setError('Data rows must start and end with |');
          return null;
        }
        
        return line
          .split('|')
          .slice(1, -1) // Remove empty elements from start/end
          .map(cell => {
            const trimmed = cell.trim();
            // Try to convert to number if it looks like a number
            if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
              return Number(trimmed);
            }
            return trimmed;
          });
      }).filter(Boolean) as any[][]; // Filter out null rows
      
      if (rows.length === 0) {
        setError('No valid data rows found');
        return null;
      }
      
      setError(null);
      return { headers, rows };
    } catch (err) {
      setError('Error parsing markdown table: ' + (err instanceof Error ? err.message : String(err)));
      return null;
    }
  };

  // Parse CSV format
  const parseCsv = (csvText: string): { headers: string[], rows: any[][] } | null => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must have at least a header row and one data row');
        return null;
      }

      // Function to parse a CSV line properly (handling quoted values with commas)
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
      
      // Parse headers
      const headers = parseCSVLine(lines[0]);
      
      // Parse data rows
      const rows = lines.slice(1)
        .filter(line => line.trim()) // Skip empty lines
        .map(line => {
          const cells = parseCSVLine(line);
          return cells.map(cell => {
            // Try to convert to number if it looks like a number
            if (/^-?\d+(\.\d+)?$/.test(cell)) {
              return Number(cell);
            }
            return cell;
          });
        });
      
      if (rows.length === 0) {
        setError('No valid data rows found');
        return null;
      }
      
      setError(null);
      return { headers, rows };
    } catch (err) {
      setError('Error parsing CSV: ' + (err instanceof Error ? err.message : String(err)));
      return null;
    }
  };

  // Detect and parse table data in various formats
  const parseTableData = (input: string): { headers: string[], rows: any[][] } | null => {
    if (!input.trim()) {
      setError('Input is empty');
      return null;
    }

    // Use specified format or auto-detect
    if (inputFormat === 'markdown' || (inputFormat === 'auto' && input.trim().startsWith('|'))) {
      return parseMarkdownTable(input);
    } else if (inputFormat === 'csv' || inputFormat === 'auto') {
      return parseCsv(input);
    }

    setError('Could not detect input format');
    return null;
  };

  const handleFormatClick = () => {
    const result = parseTableData(tableInput);
    if (result) {
      setFormattedData(result);
    } else if (!error) {
      setError('Could not parse table format');
    }
  };

  const handleExampleClick = (type: 'simple' | 'complex') => {
    if (type === 'simple') {
      setSqlQuery('SELECT AVG(depreciation_and_amortization) as average_depreciation_and_amortization FROM financial_data;');
      setTableInput('| average_depreciation_and_amortization |\n| ------------------------------------- |\n| 22413750.0000 |');
    } else {
      setSqlQuery('SELECT year, quarter, revenue, expenses, profit, growth_rate as growth FROM quarterly_financials WHERE year IN (2021, 2022) ORDER BY year, quarter;');
      setTableInput('| Year | Quarter | Revenue | Expenses | Profit | Growth |\n| ---- | ------- | ------- | -------- | ------ | ------ |\n| 2021 | Q1 | 1250000 | 780000 | 470000 | 0.12 |\n| 2021 | Q2 | 1420000 | 820000 | 600000 | 0.28 |\n| 2021 | Q3 | 1380000 | 790000 | 590000 | -0.02 |\n| 2021 | Q4 | 1510000 | 860000 | 650000 | 0.10 |\n| 2022 | Q1 | 1620000 | 940000 | 680000 | 0.05 |\n| 2022 | Q2 | 1780000 | 980000 | 800000 | 0.18 |');
    }
    setFormattedData(null);
    setError(null);
  };

  const handleCsvExampleClick = () => {
    setSqlQuery('SELECT product_name, category, price, stock_quantity, rating FROM products WHERE rating > 4.0 ORDER BY price DESC;');
    setTableInput('product_name,category,price,stock_quantity,rating\n"Premium Laptop Pro",Electronics,1299.99,45,4.8\n"Wireless Noise-Canceling Headphones",Electronics,249.95,112,4.7\n"Organic Cotton Bedding Set",Home,189.50,78,4.9\n"Smart Fitness Watch",Wearables,179.99,94,4.6\n"Gourmet Coffee Maker",Kitchen,159.00,51,4.5');
    setFormattedData(null);
    setError(null);
  };

  const handleClearClick = () => {
    setSqlQuery('');
    setTableInput('');
    setFormattedData(null);
    setError(null);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h2>Dynamic SQL Results Formatter</h2>
      <p>Enter your SQL query and paste the results to see them formatted beautifully. The tool automatically detects markdown tables and CSV formats.</p>
      
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => handleExampleClick('simple')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a6ee0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Simple Example
        </button>
        <button 
          onClick={() => handleExampleClick('complex')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a6ee0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Complex Example
        </button>
        <button 
          onClick={handleCsvExampleClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a6ee0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          CSV Example
        </button>
        <button 
          onClick={handleClearClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#e0e0e0',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          SQL Query:
        </label>
        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="Enter your SQL query here..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontWeight: 500 }}>
            Query Results:
          </label>
          <div>
            <label style={{ marginRight: '8px', fontSize: '14px' }}>Format:</label>
            <select 
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value as any)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="auto">Auto-detect</option>
              <option value="markdown">Markdown Table</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
        <textarea
          value={tableInput}
          onChange={(e) => setTableInput(e.target.value)}
          placeholder={inputFormat === 'csv' 
            ? "Enter your results in CSV format here...\nExample:\ncolumn1,column2\nvalue1,value2"
            : "Enter your results in markdown table format here...\nExample:\n| column1 | column2 |\n| ------- | ------- |\n| value1  | value2  |"
          }
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
      </div>
      
      <button 
        onClick={handleFormatClick}
        disabled={!tableInput.trim()}
        style={{
          padding: '10px 20px',
          backgroundColor: !tableInput.trim() ? '#cccccc' : '#4a6ee0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !tableInput.trim() ? 'default' : 'pointer',
          fontSize: '16px',
          marginBottom: '24px'
        }}
      >
        Format Results
      </button>
      
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {sqlQuery && (
        <div style={{ marginBottom: '20px' }}>
          <h3>SQL Query</h3>
          <SqlCodeBlock code={sqlQuery} />
        </div>
      )}
      
      {formattedData && (
        <div>
          <h3>Formatted Results</h3>
          <SqlResultsTable 
            data={formattedData}
            onCopy={() => {
              alert('Query results copied to clipboard');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SqlResultsExample; 