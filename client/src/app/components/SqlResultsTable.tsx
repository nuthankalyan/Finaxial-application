'use client';

import React, { useEffect, useState } from 'react';

interface SqlResultsTableProps {
  data: {
    headers: string[];
    rows: any[][];
  };
  onCopy?: () => void;
}

const SqlResultsTable: React.FC<SqlResultsTableProps> = ({ data, onCopy }) => {
  const { headers, rows } = data;
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode on component mount and when theme changes
  useEffect(() => {
    // Check initial theme
    const checkDarkMode = () => {
      const isDark = 
        document.documentElement.classList.contains('dark') || 
        localStorage.getItem('theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  // Theme-specific colors
  const theme = {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    borderColor: isDarkMode ? '#333333' : '#e0e0e0',
    headerBackground: isDarkMode ? '#252526' : '#f8f9fa',
    textColor: isDarkMode ? '#d4d4d4' : '#333',
    subTextColor: isDarkMode ? '#808080' : '#666',
    stripedRowColor: isDarkMode ? '#252526' : '#f8f9fa',
    copyButtonColor: isDarkMode ? '#4d9af6' : '#4a6ee0',
    copyButtonHoverBg: isDarkMode ? '#2a2d2e' : '#f0f4ff'
  };

  const copyToClipboard = () => {
    // Create a CSV-like string from the data
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    navigator.clipboard.writeText(csvContent).then(
      () => {
        if (onCopy) onCopy();
        console.log('Results copied to clipboard');
      },
      (err) => console.error('Could not copy results:', err)
    );
  };

  // Format number values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    
    // Check if it's a number
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      const num = Number(value);
      
      // Format integers
      if (Number.isInteger(num)) {
        return num.toLocaleString();
      }
      
      // Format decimals - show up to 4 decimal places if needed
      return num.toLocaleString(undefined, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      });
    }
    
    // Return strings and other types as is
    return String(value);
  };

  return (
    <div style={{
      margin: '0.75rem 0',
      borderRadius: '6px',
      overflow: 'hidden',
      backgroundColor: theme.backgroundColor,
      border: `1px solid ${theme.borderColor}`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: theme.headerBackground,
        borderBottom: `1px solid ${theme.borderColor}`
      }}>
        <span style={{ fontWeight: 600, color: theme.textColor }}>Query Results</span>
        <button 
          onClick={copyToClipboard}
          style={{
            background: 'none',
            border: 'none',
            color: theme.copyButtonColor,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            transition: 'background-color 0.2s'
          }}
          title="Copy to clipboard"
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.copyButtonHoverBg)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
      <div style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{ backgroundColor: theme.headerBackground }}>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  style={{ 
                    padding: '10px 16px', 
                    borderBottom: `1px solid ${theme.borderColor}`,
                    fontWeight: 600,
                    color: theme.textColor,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                style={{ 
                  backgroundColor: rowIndex % 2 === 0 ? theme.backgroundColor : theme.stripedRowColor
                }}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    style={{ 
                      padding: '10px 16px', 
                      borderBottom: `1px solid ${theme.borderColor}`,
                      color: theme.textColor,
                      // Right-align numbers, left-align text
                      textAlign: typeof cell === 'number' || !isNaN(Number(cell)) ? 'right' : 'left'
                    }}
                  >
                    {formatValue(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.subTextColor,
          fontStyle: 'italic'
        }}>
          No results found
        </div>
      )}
      <div style={{
        padding: '8px 16px',
        borderTop: `1px solid ${theme.borderColor}`,
        backgroundColor: theme.headerBackground,
        fontSize: '12px',
        color: theme.subTextColor,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>{rows.length} {rows.length === 1 ? 'row' : 'rows'}</span>
        <span>Query executed successfully</span>
      </div>
    </div>
  );
};

export default SqlResultsTable; 