import React from 'react';
import SqlCodeBlock from '../components/SqlCodeBlock';
import SqlResultsTable from '../components/SqlResultsTable';
import DataTable from '../components/DataTable';
import ChartVisualization from '../components/ChartVisualization';

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

const formatLists = (content: string, styles: any): React.ReactNode[] => {
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
              ? <ul className={styles.messageList}>{currentListItems.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
              : <ol className={styles.messageList}>{currentListItems.map((item, idx) => <li key={idx}>{item}</li>)}</ol>
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
          ? <ul className={styles.messageList}>{currentListItems.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
          : <ol className={styles.messageList}>{currentListItems.map((item, idx) => <li key={idx}>{item}</li>)}</ol>
        }
      </div>
    );
  }
  
  return result;
};

export const formatMessage = (
  text: string, 
  styles: any, 
  setToastMessage: (message: string) => void, 
  setShowToast: (show: boolean) => void,
  copyToClipboard: (text: string) => void,
  chartData?: any,
  tableData?: { headers: string[]; rows: any[][] }
): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  
  // If chartData is provided, add chart first
  if (chartData) {
    parts.push(
      <ChartVisualization 
        key="chart" 
        chart={chartData} 
        onExport={() => {
          setToastMessage('Chart exported successfully');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
        }}
      />
    );
  }
  
  // If tableData is provided, add table
  if (tableData) {
    parts.push(
      <DataTable 
        key="table" 
        data={tableData} 
        title="Query Results"
        onCopy={() => {
          setToastMessage('Table exported successfully');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
        }}
      />
    );
  }

  // Process text for SQL blocks and tables
  const sqlBlockRegex = /```sql\n([\s\S]*?)\n```/g;
  const markdownTableRegex = /(?:^|\n)(\|[^\n]*\|\n(?:\|[-:\s]*\|\n)?(?:\|[^\n]*\|\n?)*)/gm;
  
  let lastIndex = 0;
  let matches: { type: 'sql' | 'table', match: RegExpExecArray }[] = [];
  
  // Find all SQL blocks
  let sqlMatch;
  while ((sqlMatch = sqlBlockRegex.exec(text)) !== null) {
    matches.push({ type: 'sql', match: sqlMatch });
  }
  
  // Find all markdown tables
  let tableMatch;
  while ((tableMatch = markdownTableRegex.exec(text)) !== null) {
    matches.push({ type: 'table', match: tableMatch });
  }
  
  // Sort matches by position
  matches.sort((a, b) => a.match.index! - b.match.index!);
  
  // Process each match
  matches.forEach((item, index) => {
    const { type, match } = item;
    const beforeMatch = text.slice(lastIndex, match.index);
    
    if (beforeMatch.trim()) {
      parts.push(...formatLists(beforeMatch, styles));
    }
    
    if (type === 'sql') {
      const sqlCode = match[1];
      parts.push(
        <SqlCodeBlock 
          key={`sql-${index}`} 
          code={sqlCode} 
          onCopy={() => {
            copyToClipboard(sqlCode);
            setToastMessage('SQL copied to clipboard');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
          }}
        />
      );
    } else if (type === 'table') {
      const tableText = match[1];
      const parsedTable = parseMarkdownTable(tableText);
      
      if (parsedTable) {
        parts.push(
          <DataTable 
            key={`table-${index}`} 
            data={parsedTable} 
            onCopy={() => {
              setToastMessage('Table exported successfully');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            }}
          />
        );
      } else {
        // Fallback for unparseable tables - display as preformatted text
        parts.push(
          <div key={`fallback-table-${index}`} className={styles.tableFallback || ''}>
            <pre>{tableText}</pre>
          </div>
        );
      }
    }
    
    lastIndex = match.index! + match[0].length;
  });
  
  // Add remaining text
  const remainingText = text.slice(lastIndex);
  if (remainingText.trim()) {
    parts.push(...formatLists(remainingText, styles));
  }
  
  return <div className={styles.messageContent}>{parts}</div>;
};
