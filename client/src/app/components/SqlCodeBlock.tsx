'use client';

import React from 'react';

interface SqlCodeBlockProps {
  code: string;
  onCopy?: () => void;
}

const SqlCodeBlock: React.FC<SqlCodeBlockProps> = ({ code, onCopy }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(
      () => {
        if (onCopy) onCopy();
        console.log('SQL copied to clipboard');
      },
      (err) => console.error('Could not copy SQL:', err)
    );
  };

  // Function to format SQL with syntax highlighting
  const formatSqlWithHighlighting = () => {
    if (!code) return null;

    // SQL keywords to highlight - add more as needed
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 
      'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN', 'ON', 'AS', 'DISTINCT', 'AND', 
      'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'CREATE TABLE', 
      'INSERT INTO', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'SET',
      'ASC', 'DESC', 'WITH', 'UNION', 'ALL', 'LIMIT', 'OFFSET'
    ];

    // SQL functions to highlight
    const functions = [
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'CAST', 'COALESCE', 
      'CONCAT', 'SUBSTRING', 'LENGTH', 'UPPER', 'LOWER', 'TRIM', 'DATE', 
      'TO_CHAR', 'TO_DATE', 'EXTRACT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
    ];

    // Process each line
    const lines = code.split('\n');
    
    return lines.map((line, lineIndex) => {
      const tokens: Array<{type: string, content: string}> = [];
      let currentIndex = 0;
      const lineLength = line.length;
      
      // Helper function to check if a substring is a keyword
      const getKeywordMatch = (text: string, startIndex: number) => {
        for (const keyword of keywords) {
          // Check for word boundaries
          if (
            text.substring(startIndex).toUpperCase().startsWith(keyword) &&
            (startIndex === 0 || !/[a-zA-Z0-9_]/.test(text[startIndex - 1])) &&
            (startIndex + keyword.length === text.length || !/[a-zA-Z0-9_]/.test(text[startIndex + keyword.length]))
          ) {
            return { keyword, length: keyword.length };
          }
        }
        return null;
      };
      
      // Helper function to check if a substring is a function
      const getFunctionMatch = (text: string, startIndex: number) => {
        for (const func of functions) {
          if (
            text.substring(startIndex).toUpperCase().startsWith(func) &&
            (startIndex === 0 || !/[a-zA-Z0-9_]/.test(text[startIndex - 1])) &&
            (startIndex + func.length === text.length || !/[a-zA-Z0-9_]/.test(text[startIndex + func.length]))
          ) {
            return { func, length: func.length };
          }
        }
        return null;
      };
      
      // Tokenize the line
      while (currentIndex < lineLength) {
        // Check for string literals
        if (line[currentIndex] === "'" || line[currentIndex] === '"') {
          const quoteChar = line[currentIndex];
          let endIndex = currentIndex + 1;
          while (endIndex < lineLength) {
            if (line[endIndex] === quoteChar && line[endIndex - 1] !== '\\') {
              break;
            }
            endIndex++;
          }
          
          if (endIndex < lineLength) {
            tokens.push({
              type: 'string',
              content: line.substring(currentIndex, endIndex + 1)
            });
            currentIndex = endIndex + 1;
          } else {
            // Unclosed string
            tokens.push({
              type: 'string',
              content: line.substring(currentIndex)
            });
            currentIndex = lineLength;
          }
          continue;
        }
        
        // Check for numbers
        const numberMatch = /^\d+(\.\d+)?/.exec(line.substring(currentIndex));
        if (numberMatch) {
          tokens.push({
            type: 'number',
            content: numberMatch[0]
          });
          currentIndex += numberMatch[0].length;
          continue;
        }
        
        // Check for keywords
        const keywordMatch = getKeywordMatch(line, currentIndex);
        if (keywordMatch) {
          tokens.push({
            type: 'keyword',
            content: line.substring(currentIndex, currentIndex + keywordMatch.length)
          });
          currentIndex += keywordMatch.length;
          continue;
        }
        
        // Check for functions
        const functionMatch = getFunctionMatch(line, currentIndex);
        if (functionMatch) {
          tokens.push({
            type: 'function',
            content: line.substring(currentIndex, currentIndex + functionMatch.length)
          });
          currentIndex += functionMatch.length;
          continue;
        }
        
        // If nothing special, take the next character as plain text
        // Optimize by taking consecutive plain text characters together
        let plainTextEnd = currentIndex + 1;
        while (
          plainTextEnd < lineLength &&
          line[plainTextEnd] !== "'" &&
          line[plainTextEnd] !== '"' &&
          !/\d/.test(line[plainTextEnd]) &&
          !getKeywordMatch(line, plainTextEnd) &&
          !getFunctionMatch(line, plainTextEnd)
        ) {
          plainTextEnd++;
        }
        
        tokens.push({
          type: 'plain',
          content: line.substring(currentIndex, plainTextEnd)
        });
        currentIndex = plainTextEnd;
      }
      
      // Render the tokens with appropriate styles
      return (
        <React.Fragment key={lineIndex}>
          {tokens.map((token, tokenIndex) => {
            switch (token.type) {
              case 'keyword':
                return <span key={tokenIndex} style={{ color: '#569cd6' }}>{token.content}</span>;
              case 'function':
                return <span key={tokenIndex} style={{ color: '#dcdcaa' }}>{token.content}</span>;
              case 'string':
                return <span key={tokenIndex} style={{ color: '#ce9178' }}>{token.content}</span>;
              case 'number':
                return <span key={tokenIndex} style={{ color: '#b5cea8' }}>{token.content}</span>;
              default:
                return <span key={tokenIndex}>{token.content}</span>;
            }
          })}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{
      margin: '0.75rem 0',
      borderRadius: '3px',
      overflow: 'hidden',
      backgroundColor: '#1e1e1e',
      border: '1px solid #333333',
      fontFamily: 'Consolas, "Courier New", monospace'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3px 8px',
        backgroundColor: '#252526',
        color: '#808080',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '12px'
      }}>
        <span>sql</span>
        <button 
          onClick={copyToClipboard}
          style={{
            background: 'none',
            border: 'none',
            color: '#808080',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Copy"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <pre style={{
        backgroundColor: '#1e1e1e',
        padding: '10px 16px',
        margin: 0,
        fontSize: '13px',
        overflow: 'auto',
        whiteSpace: 'pre',
        color: '#d4d4d4',
        lineHeight: 1.5
      }}>
        <code>
          {formatSqlWithHighlighting()}
        </code>
      </pre>
    </div>
  );
};

export default SqlCodeBlock; 