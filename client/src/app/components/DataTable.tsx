'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './DataTable.module.css';

interface DataTableProps {
  data: {
    headers: string[];
    rows: (string | number)[][];
  };
  title?: string;
  onCopy?: () => void;
  showExport?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  title = "Data Table", 
  onCopy, 
  showExport = true 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { headers, rows } = data;

  // Function to export data to Excel
  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for worksheet
      const wsData = [headers, ...rows];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
      ws['!cols'] = colWidths;
      
      // Style the header row
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E3F2FD" } },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, title);
      
      // Generate file name with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.xlsx`;
      
      // Save the file
      XLSX.writeFile(wb, fileName);
      
      console.log(`Exported to ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Function to export data to CSV
  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Convert data to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Handle cells that contain commas or quotes
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.csv`;
      
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Exported to ${fileName}`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Function to copy table data to clipboard
  const copyToClipboard = () => {
    const tableText = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');
    
    navigator.clipboard.writeText(tableText).then(
      () => {
        if (onCopy) onCopy();
        console.log('Table data copied to clipboard');
      },
      (err) => console.error('Could not copy table data:', err)
    );
  };

  return (
    <div className={styles.tableContainer}>
      {/* Table Header with Actions */}
      <div className={styles.tableHeader}>
        <h4 className={styles.tableTitle}>{title}</h4>
        <div className={styles.tableActions}>
          {showExport && (
            <>
              <button
                className={styles.actionButton}
                onClick={exportToExcel}
                disabled={isExporting}
                title="Export to Excel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="21"></line>
                  <line x1="8" y1="13" x2="16" y2="21"></line>
                </svg>
                {isExporting ? 'Exporting...' : 'Excel'}
              </button>
              
              <button
                className={styles.actionButton}
                onClick={exportToCSV}
                disabled={isExporting}
                title="Export to CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                CSV
              </button>
            </>
          )}
          
          <button
            className={styles.actionButton}
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
      </div>
      
      {/* Scrollable Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className={styles.tableHeaderCell}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.tableRow}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={styles.tableCell}>
                    {typeof cell === 'number' ? 
                      cell.toLocaleString() : 
                      String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer */}
      <div className={styles.tableFooter}>
        <span className={styles.tableInfo}>
          {rows.length} rows × {headers.length} columns
        </span>
      </div>
    </div>
  );
};

export default DataTable;
