import React, { useState, useEffect } from 'react';
import { parseCsvPreview } from '../../utils/csvParser';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaPreviewModalWrapper } from '../SchemaPreviewModal/SchemaPreviewModalWrapper';
import { prepareTableSchemas } from '../../utils/tableSchemaPreparation';
import { inferColumnType } from '../../utils/typeInference';
import styles from './CsvPreviewModal.module.css';
import { HiddenColumnsMap } from '../../types/hiddenColumns';

interface FileData {
  content: string;
  file: File;
  type: 'csv' | 'excel';
}

interface CsvPreviewModalProps {
  files: FileData[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const CsvPreviewModal: React.FC<CsvPreviewModalProps> = ({
  files,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [showSchemaVisualization, setShowSchemaVisualization] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<{
    headers: string[];
    rows: string[][];
    sheets?: { name: string; headers: string[]; rows: string[][] }[];
  }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hiddenColumns, setHiddenColumns] = useState<HiddenColumnsMap>({});

  // Parse all files on component load
  useEffect(() => {
    const parsed = files.map((file) => {
      if (file.type === 'excel') {
        // Parse Excel data from JSON string
        const excelData = JSON.parse(file.content);
        // Convert the sheets object to an array format
        const sheets = Object.entries(excelData.sheets).map(([name, data]: [string, any]) => ({
          name,
          headers: data.headers,
          rows: data.rows
        }));
        // Return the first sheet's data as main data and include all sheets
        return {
          headers: excelData.sheets[excelData.primarySheet].headers,
          rows: excelData.sheets[excelData.primarySheet].rows,
          sheets: sheets
        };
      } else {
        return parseCsvPreview(file.content);
      }
    });
    setParsedFiles(parsed);
  }, [files]);
  
  // Initialize hiddenColumns state when files change
  useEffect(() => {
    const initialHiddenColumns: HiddenColumnsMap = {};
    
    files.forEach((file, fileIndex) => {
      initialHiddenColumns[fileIndex] = {};
      
      if (parsedFiles[fileIndex]) {
        if (file.type === 'excel' && parsedFiles[fileIndex].sheets) {
          parsedFiles[fileIndex].sheets.forEach((_, sheetIndex) => {
            initialHiddenColumns[fileIndex][sheetIndex] = [];
          });
        } else {
          initialHiddenColumns[fileIndex][0] = []; // Default sheet index 0 for CSV
        }
      }
    });
    
    setHiddenColumns(initialHiddenColumns);
  }, [files, parsedFiles]);
  const handleUpload = async () => {
    setIsLoading(true);
    try {
      // Store hidden columns in localStorage for use in insight generation and schema visualization
      localStorage.setItem('hiddenColumns', JSON.stringify(hiddenColumns));
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get the currently active sheet data
  const getActiveSheetData = () => {
    const activeFile = parsedFiles[activeTabIndex];
    
    if (activeFile?.sheets && activeFile.sheets.length > 0) {
      return activeFile.sheets[selectedSheetIndex];
    }
    
    return activeFile;
  };

  const activeData = getActiveSheetData();
  // Toggle column visibility
  const toggleColumnVisibility = (columnIndex: number) => {
    console.log(`Toggle called for column ${columnIndex}`);
    
    setHiddenColumns(prevHidden => {
      // Create a deep copy of the previous state
      const newHidden = JSON.parse(JSON.stringify(prevHidden));
      
      // Initialize nested objects if they don't exist
      if (!newHidden[activeTabIndex]) {
        newHidden[activeTabIndex] = {};
      }
      
      if (!newHidden[activeTabIndex][selectedSheetIndex]) {
        newHidden[activeTabIndex][selectedSheetIndex] = [];
      }
      
      // Check if column is already hidden
      const columnHiddenIndex = newHidden[activeTabIndex][selectedSheetIndex].indexOf(columnIndex);
      
      if (columnHiddenIndex === -1) {
        // Add to hidden columns
        console.log(`Hiding column ${columnIndex}`);
        
        // Create a new array with the added column index
        const updatedHiddenColumns = [...newHidden[activeTabIndex][selectedSheetIndex], columnIndex];
        newHidden[activeTabIndex][selectedSheetIndex] = updatedHiddenColumns;
        
      } else {
        // Remove from hidden columns
        console.log(`Showing column ${columnIndex}`);
        
        // Create a new filtered array without the column index
        const updatedHiddenColumns = newHidden[activeTabIndex][selectedSheetIndex]
          .filter((idx: number) => idx !== columnIndex);
        newHidden[activeTabIndex][selectedSheetIndex] = updatedHiddenColumns;
      }
      
      // Log the state for debugging
      console.log('Updated hidden columns:', newHidden);
      
      return newHidden;
    });
  };
  
  // Hide all columns
  const hideAllColumns = () => {
    if (!activeData || !activeData.headers) return;
    
    setHiddenColumns(prevHidden => {
      const newHidden = { ...prevHidden };
      
      if (!newHidden[activeTabIndex]) {
        newHidden[activeTabIndex] = {};
      }
      
      // Add all column indices to hidden array
      newHidden[activeTabIndex][selectedSheetIndex] = Array.from(
        { length: activeData.headers.length }, 
        (_, index) => index
      );
      
      return newHidden;
    });
  };
  
  // Show all columns
  const showAllColumns = () => {
    setHiddenColumns(prevHidden => {
      const newHidden = { ...prevHidden };
      
      if (!newHidden[activeTabIndex]) {
        newHidden[activeTabIndex] = {};
      }
      
      // Clear all hidden columns for this file/sheet
      newHidden[activeTabIndex][selectedSheetIndex] = [];
      
      return newHidden;
    });
  };
    // Check if a column is hidden
  const isColumnHidden = (columnIndex: number): boolean => {
    if (!hiddenColumns[activeTabIndex] || 
        !hiddenColumns[activeTabIndex][selectedSheetIndex]) {
      return false;
    }
    
    const isHidden = hiddenColumns[activeTabIndex][selectedSheetIndex].includes(columnIndex);
    // Debug to console when checking specific columns (e.g., first few)
    if (columnIndex < 3) {
      console.log(`Column ${columnIndex} hidden status:`, isHidden);
    }
    return isHidden;
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoomLevel(prev => {
        const newZoom = prev + (delta > 0 ? 0.1 : -0.1);
        return Math.min(Math.max(newZoom, 0.5), 2); // Limit zoom between 50% and 200%
      });
    }
  };

  // Add wheel event listener
  useEffect(() => {
    const tableWrapper = document.querySelector(`.${styles.tableWrapper}`);
    if (tableWrapper) {
      tableWrapper.addEventListener('wheel', handleWheel as any, { passive: false });
    }
    return () => {
      if (tableWrapper) {
        tableWrapper.removeEventListener('wheel', handleWheel as any);
      }
    };
  }, []);

  // Force refresh UI when hiddenColumns change
  useEffect(() => {
    // Small timeout to ensure DOM has updated
    const timeout = setTimeout(() => {
      console.log('Refreshing hidden columns UI');
      // Force a refresh of the hidden styles
      const hiddenHeaders = document.querySelectorAll('th.' + styles.hiddenColumnHeader);
      const hiddenCells = document.querySelectorAll('td.' + styles.hiddenColumnCell);
      
      console.log(`Found ${hiddenHeaders.length} hidden headers and ${hiddenCells.length} hidden cells`);
        // Refresh headers
      hiddenHeaders.forEach(header => {
        header.classList.remove(styles.hiddenColumnHeader);
        void (header as HTMLElement).offsetWidth; // Force reflow
        header.classList.add(styles.hiddenColumnHeader);
      });
      
      // Refresh cells
      hiddenCells.forEach(cell => {
        cell.classList.remove(styles.hiddenColumnCell);
        void (cell as HTMLElement).offsetWidth; // Force reflow
        cell.classList.add(styles.hiddenColumnCell);
      });
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [hiddenColumns, styles.hiddenColumnHeader, styles.hiddenColumnCell]);

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
        >
          <div className={styles.modalHeader}>
            <h2>
              <span className={styles.fileIcon}>
                {files.some((file) => file.type === 'excel') &&
                files.some((file) => file.type === 'csv')
                  ? '📊📄'
                  : files.some((file) => file.type === 'excel')
                  ? '📊'
                  : '📄'}
              </span>
              Data Preview ({files.length} {files.length === 1 ? 'file' : 'files'})
            </h2>
            <button 
              onClick={onCancel}
              className={styles.closeButton}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.fileTabs}>
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`${styles.fileTab} ${
                    index === activeTabIndex ? styles.activeFileTab : ''
                  }`}
                  onClick={() => {
                    setActiveTabIndex(index);
                    setSelectedSheetIndex(0);
                  }}
                >
                  <span className={styles.fileTypeIcon}>
                    {file.type === 'excel' ? '📊' : '📄'}
                  </span>
                  {file.file.name}
                </button>
              ))}
            </div>            {activeData ? (
              <>
                {/* Show sheet tabs if the active file is Excel and has multiple sheets */}
                {files[activeTabIndex].type === 'excel' &&
                 parsedFiles[activeTabIndex]?.sheets &&
                 parsedFiles[activeTabIndex].sheets.length > 1 && (
                  <div className={styles.sheetTabs}>
                    <div className={styles.sheetTabsScroll}>
                      {parsedFiles[activeTabIndex].sheets?.map((sheet, idx) => (
                        <button
                          key={idx}
                          className={`${styles.sheetTab} ${
                            idx === selectedSheetIndex ? styles.activeSheetTab : ''
                          }`}
                          onClick={() => setSelectedSheetIndex(idx)}
                        >
                          {sheet.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}                <div 
                  className={styles.tableWrapper} 
                  style={{ transform: `scale(${zoomLevel})` }}
                >                {activeData && activeData.headers ? (
                    <>                      <div className={styles.columnVisibilityControls}>
                        <span style={{ 
                          fontSize: '0.9rem', 
                          color: '#374151', 
                          marginRight: '10px',
                          padding: '4px 8px',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          fontWeight: '500'
                        }}>
                          <span style={{ marginRight: '4px' }}>ℹ️</span>
                          Hidden columns will be excluded from insights and schema diagrams
                        </span>
                        <button 
                          className={styles.columnVisibilityButton}
                          onClick={hideAllColumns}
                          title="Hide all columns - hidden columns won't be used for insight generation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                          </svg>
                          Hide All
                        </button>
                        <button 
                          className={styles.columnVisibilityButton}
                          onClick={showAllColumns}
                          title="Show all columns for insight generation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                          </svg>
                          Show All
                        </button>
                      </div>
                      <table className={styles.previewTable} style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
                        <thead>
                          <tr>                            {activeData.headers.map((header, index) => (                              <th 
                                key={index} 
                                className={isColumnHidden(index) ? styles.hiddenColumnHeader : ''}
                              >
                                <div className={styles.columnHeader}>                                  <button
                                    className={styles.columnToggle}
                                    data-hidden={isColumnHidden(index)}
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent event bubbling
                                      toggleColumnVisibility(index);
                                    }}
                                    title={isColumnHidden(index) ? "Show column" : "Hide column"}
                                    aria-label={isColumnHidden(index) ? `Show column ${header}` : `Hide column ${header}`}
                                    type="button"
                                  >
                                    {isColumnHidden(index) ? (
                                      <svg className={styles.columnToggleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                      </svg>
                                    ) : (
                                      <svg className={styles.columnToggleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                      </svg>
                                    )}
                                  </button>
                                  {header ? header.trim() : ''}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>                          {activeData.rows && activeData.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}
                            >
                              {row.map((cell, cellIndex) => (                                <td 
                                  key={cellIndex} 
                                  className={isColumnHidden(cellIndex) ? styles.hiddenColumnCell : ''}
                                >
                                  <span style={{ position: 'relative', zIndex: 2 }}>{cell || ''}</span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>                  ) : (
                    <div className={styles.noData}>No data available</div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.loadingTable}>Loading file preview...</div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>              <button
                className={styles.schemaButton}
                onClick={() => setShowSchemaVisualization(true)}
                disabled={isLoading}
                title="View schema diagram (hidden columns will be excluded)"
              >
                <span className={styles.schemaIcon}>🔍</span>
                <span>View Schema</span>
              </button>
            </div>
            <div className={styles.footerRight}>
              <button
                className={styles.cancelButton}
                onClick={onCancel}
                disabled={isLoading}
              >
                <span>Cancel</span>
              </button>              <button
                className={styles.uploadButton}
                onClick={handleUpload}
                disabled={isLoading}
                title="Generate insights based on the data (hidden columns will be excluded)"
              >
                {isLoading ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Insights</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>      {/* Schema Visualization Modal */}      <SchemaPreviewModalWrapper
        isOpen={showSchemaVisualization}
        onCloseAction={() => setShowSchemaVisualization(false)}
        tables={prepareTableSchemas(parsedFiles, files, hiddenColumns)}      />
    </AnimatePresence>
  );
};
