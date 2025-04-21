import React from 'react';
import SqlCodeBlock from '../components/SqlCodeBlock';
import SqlResultsTable from '../components/SqlResultsTable';

// Helper function to parse markdown tables into structured data
const parseMarkdownTable = (tableText: string): { headers: string[], rows: string[][] } | null => {
  const lines = tableText.trim().split('\n');
  if (lines.length < 3) return null; // Need at least header, separator, and one data row
  
  // Extract headers from the first line
  const headerLine = lines[0].trim();
  if (!headerLine.startsWith('|') || !headerLine.endsWith('|')) return null;
  
  const headers = headerLine
    .split('|')
    .slice(1, -1) // Remove empty elements from start/end
    .map(header => header.trim());
  
  // Verify separator line (second line)
  const separatorLine = lines[1].trim();
  if (!separatorLine.startsWith('|') || !separatorLine.endsWith('|')) return null;
  if (!separatorLine.includes('-')) return null;
  
  // Extract data rows
  const rows = lines.slice(2).map(line => {
    if (!line.trim().startsWith('|') || !line.trim().endsWith('|')) return [];
    return line
      .split('|')
      .slice(1, -1) // Remove empty elements from start/end
      .map(cell => cell.trim());
  }).filter(row => row.length > 0);
  
  return { headers, rows };
};

export const formatMessage = (
  text: string, 
  styles: any, 
  setToastMessage: (message: string) => void, 
  setShowToast: (show: boolean) => void,
  copyToClipboard: (text: string) => void
): React.ReactNode => {
  const formatLists = (content: string): React.ReactNode[] => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let currentListItems: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' = 'ul';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a list item
      const unorderedMatch = line.match(/^[-*•]\s+(.*)/);
      const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)/);
      
      if (unorderedMatch) {
        if (!inList) {
          inList = true;
          listType = 'ul';
        }
        currentListItems.push(unorderedMatch[1]);
      } else if (orderedMatch) {
        if (!inList) {
          inList = true;
          listType = 'ol';
        }
        currentListItems.push(orderedMatch[2]);
      } else {
        // If we were in a list but now we're not, add the list to results
        if (inList) {
          result.push(
            <div key={`list-${i}`} className={styles.messageParagraph}>
              {listType === 'ul' 
                ? <ul className={styles.messageList}>{currentListItems.map((item, i) => <li key={i}>{item}</li>)}</ul>
                : <ol className={styles.messageList}>{currentListItems.map((item, i) => <li key={i}>{item}</li>)}</ol>
              }
            </div>
          );
          inList = false;
          currentListItems = [];
        }
        
        // Add normal paragraph
        if (line) {
          result.push(
            <div key={`paragraph-${i}`} className={styles.messageParagraph}>{line}</div>
          );
        } else if (i > 0 && lines[i-1].trim()) {
          // Add spacing for empty lines, but only if previous line wasn't also empty
          result.push(<div key={`space-${i}`} className={styles.messageSpace}></div>);
        }
      }
    }
    
    // If we ended while still in a list, add it to results
    if (inList) {
      result.push(
        <div key={`list-end`} className={styles.messageParagraph}>
          {listType === 'ul' 
            ? <ul className={styles.messageList}>{currentListItems.map((item, i) => <li key={i}>{item}</li>)}</ul>
            : <ol className={styles.messageList}>{currentListItems.map((item, i) => <li key={i}>{item}</li>)}</ol>
          }
        </div>
      );
    }
    
    return result;
  };

  // Check if text might contain SQL query (without code blocks)
  const hasSqlContent = (text: string): boolean => {
    const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'CREATE TABLE', 'INSERT INTO', 'UPDATE', 'DELETE'];
    const upperText = text.toUpperCase();
    
    // Check if text contains multiple SQL keywords (at least 2)
    let keywordCount = 0;
    for (const keyword of sqlKeywords) {
      if (upperText.includes(keyword)) {
        keywordCount++;
        if (keywordCount >= 2) return true;
      }
    }
    
    return false;
  };

  // Detect SQL queries that are not in code blocks and wrap them in code blocks
  if (!text.includes('```') && hasSqlContent(text)) {
    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    const result: React.ReactNode[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      if (hasSqlContent(paragraph)) {
        // This looks like a SQL query, wrap it in a code block
        result.push(
          <div key={`sql-intro-${index}`} className={styles.messageParagraph}>
            Here's the SQL query:
          </div>,
          <SqlCodeBlock 
            key={`sql-${index}`} 
            code={paragraph.trim()} 
            onCopy={() => {
              setToastMessage('SQL copied to clipboard');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            }}
          />
        );
      } else {
        // Process normal paragraph
        result.push(...formatLists(paragraph));
      }
    });
    
    return <>{result}</>;
  }

  // Format code blocks (with special handling for SQL)
  if (text.includes('```')) {
    const parts = text.split(/```(?:(sql|javascript|js|python|py|java|ruby|csharp|c#|c\+\+|cpp|php|html|css|bash|shell|json|yaml|xml)|)([^`]*?)```/gi);
    const result: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // This is regular text, format it normally
        if (parts[i]) {
          result.push(...formatLists(parts[i]));
        }
      } else if (i % 3 === 1) {
        // This is the language indicator (if any)
        // We'll use this in the next iteration
        continue;
      } else {
        // This is a code block with the language from parts[i-1]
        const language = parts[i-1]?.toLowerCase() || '';
        const codeContent = parts[i].trim();
        
        // Special handling for SQL code
        if (language === 'sql') {
          result.push(
            <SqlCodeBlock 
              key={`code-block-${i}`} 
              code={codeContent}
              onCopy={() => {
                setToastMessage('SQL copied to clipboard');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
              }}
            />
          );
        } else {
          // Regular code blocks
          result.push(
            <pre key={`code-${i}`} className={styles.messageCode}>
              <div className={styles.codeHeader}>
                <span>{language || 'code'}</span>
                <button 
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(codeContent)}
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
              <code>{codeContent}</code>
            </pre>
          );
        }
      }
    }
    
    return <>{result}</>;
  }
  
  // Handle tables (if present)
  if (text.includes('|') && text.includes('\n')) {
    // Try to detect if there's a table in the text
    const lines = text.split('\n');
    const tableStartIndex = lines.findIndex(line => line.includes('|') && line.includes('-'));
    
    if (tableStartIndex > 0) {
      // There's likely a table - handle everything before it normally
      const beforeTable = lines.slice(0, tableStartIndex - 1).join('\n');
      const tableSection = lines.slice(tableStartIndex - 1).join('\n');
      
      // Try to parse the markdown table
      const parsedTable = parseMarkdownTable(tableSection);
      
      if (parsedTable && parsedTable.headers.length > 0 && parsedTable.rows.length > 0) {
        // Check if this is an expected SQL results table
        const isExpectedResultsTable = beforeTable.toLowerCase().includes('result') || 
                                       beforeTable.toLowerCase().includes('query') ||
                                       beforeTable.toLowerCase().includes('output');
        
        return (
          <>
            {formatLists(beforeTable)}
            <SqlResultsTable 
              data={{
                headers: parsedTable.headers,
                rows: parsedTable.rows.map(row => 
                  row.map(cell => {
                    // Try to convert numeric values
                    const num = Number(cell);
                    return !isNaN(num) ? num : cell;
                  })
                )
              }}
              onCopy={() => {
                setToastMessage('Query results copied to clipboard');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
              }}
            />
          </>
        );
      }
      
      // If we couldn't parse as an SQL result table, use the old table formatting code
      // Process the table
      const tableRows: string[][] = [];
      let inTable = false;
      let headers: string[] = [];
      const tableLines = lines.slice(tableStartIndex - 1);
      
      for (let i = 0; i < tableLines.length; i++) {
        const line = tableLines[i].trim();
        
        if (line.includes('|')) {
          if (!inTable) {
            // This is the header row
            headers = line.split('|')
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell);
            inTable = true;
          } else if (line.includes('-')) {
            // This is the separator row, skip it
            continue;
          } else {
            // This is a data row
            const cells = line.split('|')
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell);
            
            if (cells.length > 0) {
              tableRows.push(cells);
            }
          }
        }
      }
      
      // Only proceed with table if we have headers and rows
      if (headers.length > 0 && tableRows.length > 0) {
        // Check if this is an expected SQL results table
        const isExpectedResultsTable = beforeTable.includes('Expected Results') || 
                                      beforeTable.includes('expected results') || 
                                      beforeTable.includes('Query Results') ||
                                      beforeTable.includes('query results');
        
        return (
          <>
            {formatLists(beforeTable)}
            <div className={`${styles.messageTableContainer} ${isExpectedResultsTable ? styles.expectedResultsTable : ''}`}>
              {isExpectedResultsTable && (
                <div className={styles.expectedResultsHeader}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Expected Query Results</span>
                </div>
              )}
              <table className={styles.messageTable}>
                <thead>
                  <tr>
                    {headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      }
    }
  }
  
  // Default formatting for text without tables or code blocks
  return <>{formatLists(text)}</>;
}; 