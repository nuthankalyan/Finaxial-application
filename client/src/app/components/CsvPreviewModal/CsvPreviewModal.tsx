'use client';

import React, { useState, useEffect, WheelEvent } from 'react';
import { parseCsvPreview } from '../../utils/csvParser';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaPreviewModalWrapper } from '../SchemaPreviewModal/SchemaPreviewModalWrapper';
import { prepareTableSchemas } from '../../utils/tableSchemaPreparation';
import { inferColumnType } from '../../utils/typeInference';
import styles from './CsvPreviewModal.module.css';
import { LoadingOverlay } from '../LoadingOverlay/LoadingOverlay';

interface FileData {
  content: string;
  file: File;
  type: 'csv' | 'excel';
}

interface CsvPreviewModalProps {
  files: FileData[];
  onConfirmAction: () => Promise<void>;
  onCancelAction: () => void;
}

interface ParsedFile {
  headers: string[];
  rows: string[][];
  sheets?: { name: string; headers: string[]; rows: string[][] }[];
}

interface ActiveData {
  headers: string[];
  rows: string[][];
}

export const CsvPreviewModal: React.FC<CsvPreviewModalProps> = ({
  files,
  onConfirmAction,
  onCancelAction,
}): React.ReactElement => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [showSchemaVisualization, setShowSchemaVisualization] = useState(false);
  const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Toggle column visibility
  const toggleColumnVisibility = (header: string): void => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(header)) {
        newSet.delete(header);
      } else {
        newSet.add(header);
      }
      return newSet;
    });
    setShowHiddenColumnsMenu(false);
  };
  // Get active data based on current tab and sheet
  const getActiveData = (): ActiveData | null => {
    const file = parsedFiles[activeTabIndex];
    if (!file) return null;

    if (files[activeTabIndex]?.type === 'excel' && file.sheets) {
      // Ensure selectedSheetIndex is valid
      const validSheetIndex = Math.min(selectedSheetIndex, file.sheets.length - 1);
      const sheet = file.sheets[validSheetIndex];
      
      if (!sheet) return null;
      
      return {
        headers: sheet.headers || [],
        rows: sheet.rows || []
      };
    }

    return {
      headers: file.headers,
      rows: file.rows
    };
  };

  // Function to get visible row data
  const getVisibleRowData = (row: string[], headers: string[]): string[] => {
    return row.filter((_, index) => !hiddenColumns.has(headers[index]));
  };

  // Handle wheel zoom
  const handleWheel = (e: WheelEvent<HTMLDivElement>): void => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoomLevel((prevZoom) => {
        const newZoom = prevZoom + (e.deltaY > 0 ? -0.1 : 0.1);
        return Math.min(Math.max(newZoom, 0.5), 2);
      });
    }
  };  // Parse files on load
  useEffect(() => {
    const parsed = files.map((file) => {
      if (file.type === 'excel') {
        const excelData = JSON.parse(file.content);
        console.log('Excel data parsed:', { 
          fileName: file.file.name, 
          primarySheet: excelData.primarySheet, 
          sheetsKeys: Object.keys(excelData.sheets || {}),
          sheets: excelData.sheets 
        });
        
        const sheets = Object.entries(excelData.sheets).map(([name, data]: [string, any]) => ({
          name,
          headers: data.headers,
          rows: data.rows
        }));
        
        console.log('Processed sheets:', sheets);
        
        return {
          headers: excelData.sheets[excelData.primarySheet].headers,
          rows: excelData.sheets[excelData.primarySheet].rows,
          sheets
        };
      } else {
        return parseCsvPreview(file.content);
      }
    });
    console.log('All parsed files:', parsed);
    setParsedFiles(parsed);
  }, [files]);

  // Reset sheet index when active tab changes or when parsed files change
  useEffect(() => {
    const currentFile = parsedFiles[activeTabIndex];
    if (currentFile && files[activeTabIndex]?.type === 'excel' && currentFile.sheets) {
      // Ensure selectedSheetIndex is within bounds
      if (selectedSheetIndex >= currentFile.sheets.length) {
        setSelectedSheetIndex(0);
      }
    } else {
      // For non-Excel files, always reset to 0
      setSelectedSheetIndex(0);
    }
  }, [activeTabIndex, parsedFiles, selectedSheetIndex]);

  // Process data and handle upload
  const handleUpload = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onConfirmAction();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle modal close
  const handleClose = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      onCancelAction();
    }
  };

  // Handle modal content click
  const handleModalContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent clicks inside modal from closing it
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setShowHiddenColumnsMenu(false);
      setShowSchemaVisualization(false);
    };
  }, []);

  const data = getActiveData();
  const hiddenColumnsCount = data?.headers.filter(h => hiddenColumns.has(h)).length || 0;

  // Handle cancel/close
  const handleCloseAction = () => {
    if (!isLoading) {
      onCancelAction();
    }
  };

  // Handle confirm/generate insights
  const handleConfirmAction = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Process files before confirming
      const processedFiles = parsedFiles.map((file, index) => {
        if (files[index].type === 'excel' && file.sheets) {
          const processedSheets = file.sheets.map(sheet => ({
            name: sheet.name,
            headers: sheet.headers.filter(header => !hiddenColumns.has(header)),
            rows: sheet.rows.map(row => 
              row.filter((_, colIndex) => !hiddenColumns.has(sheet.headers[colIndex]))
            )
          }));

          const primarySheetName = processedSheets[0]?.name || '';
          const sheetsObject: Record<string, { headers: string[]; rows: string[][] }> = {};
          
          processedSheets.forEach(sheet => {
            sheetsObject[sheet.name] = {
              headers: sheet.headers,
              rows: sheet.rows
            };
          });

          // Update original file content
          files[index].content = JSON.stringify({
            primarySheet: primarySheetName,
            sheets: sheetsObject
          });

          return {
            headers: sheetsObject[primarySheetName].headers,
            rows: sheetsObject[primarySheetName].rows,
            sheets: processedSheets
          };
        } else {
          const visibleHeaders = file.headers.filter(header => !hiddenColumns.has(header));
          const visibleRows = file.rows.map(row => 
            row.filter((_, colIndex) => !hiddenColumns.has(file.headers[colIndex]))
          );

          // Update original file content
          files[index].content = [
            visibleHeaders.join(','),
            ...visibleRows.map(row => row.join(','))
          ].join('\n');

          return {
            headers: visibleHeaders,
            rows: visibleRows
          };
        }
      });

      setParsedFiles(processedFiles);
      await onConfirmAction();
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking outside modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose(e);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          onClick={handleModalContentClick}
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
              onClick={handleClose}
              className={styles.closeButton}
              aria-label="Close"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* User Guidance */}
          <div className={styles.userGuidance}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>
              You can hide/show columns using the eye icon in each column header. 
              {hiddenColumnsCount > 0 && ` Currently ${hiddenColumnsCount} column${hiddenColumnsCount > 1 ? 's are' : ' is'} hidden.`}
            </span>
          </div>

          <div className={styles.modalBody}>            <div className={styles.fileTabs}>
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`${styles.fileTab} ${
                    index === activeTabIndex ? styles.activeFileTab : ''
                  }`}
                  onClick={() => {
                    setActiveTabIndex(index);
                    // Reset sheet index when switching files
                    setSelectedSheetIndex(0);
                  }}
                  disabled={isLoading}
                >
                  <span className={styles.fileTypeIcon}>
                    {file.type === 'excel' ? '📊' : '📄'}
                  </span>
                  {file.file.name}
                </button>
              ))}
            </div><div className={styles.previewContainer}>
              {data ? (
                <>
                  {(() => {
                    const isExcel = files[activeTabIndex]?.type === 'excel';
                    const hasSheets = parsedFiles[activeTabIndex]?.sheets;
                    const sheetsLength = parsedFiles[activeTabIndex]?.sheets?.length || 0;
                    
                    console.log('Sheet tabs debug:', {
                      activeTabIndex,
                      isExcel,
                      hasSheets: !!hasSheets,
                      sheetsLength,
                      sheets: parsedFiles[activeTabIndex]?.sheets
                    });
                    
                    return isExcel && hasSheets && sheetsLength > 0 ? (
                      <div className={styles.sheetTabs}>
                        <div className={styles.sheetTabsScroll}>
                          {parsedFiles[activeTabIndex].sheets?.map((sheet, idx) => (
                            <button
                              key={idx}
                              className={`${styles.sheetTab} ${
                                idx === selectedSheetIndex ? styles.activeSheetTab : ''
                              }`}
                              onClick={() => setSelectedSheetIndex(idx)}
                              disabled={isLoading}
                            >
                              {sheet.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <div className={styles.tableContainer}>
                    <div
                      className={styles.tableWrapper}
                      style={{ transform: `scale(${zoomLevel})` }}
                      onWheel={handleWheel}
                    >
                      <table className={styles.previewTable}>
                        <thead>
                          <tr>
                            {data.headers.map((header, index) => (
                              !hiddenColumns.has(header) && (
                                <th key={index}>
                                  <div className={styles.columnHeader}>
                                    <div className={styles.headerContent}>
                                      {header ? header.trim() : ''}
                                    </div>
                                    <button
                                      className={styles.columnToggleButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleColumnVisibility(header);
                                      }}
                                      title="Hide this column"
                                      disabled={isLoading}
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                      </svg>
                                    </button>
                                  </div>
                                </th>
                              )
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}
                            >
                              {row.map((cell, cellIndex) => !hiddenColumns.has(data.headers[cellIndex]) && (
                                <td key={cellIndex}>{cell || ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
              <LoadingOverlay isVisible={isLoading} />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              {hiddenColumnsCount > 0 && (
                <div className={styles.hiddenColumnsWrapper}>
                  <button
                    className={styles.showHiddenColumnsButton}
                    onClick={() => setShowHiddenColumnsMenu(!showHiddenColumnsMenu)}
                    title={`${hiddenColumnsCount} column${hiddenColumnsCount > 1 ? 's' : ''} hidden`}
                  >
                    Hidden Columns
                    <span className={styles.hiddenColumnsCount}>
                      {hiddenColumnsCount}
                    </span>
                  </button>

                  {showHiddenColumnsMenu && (
                    <div className={styles.hiddenColumnsMenu}>
                      <div className={styles.hiddenColumnsList}>
                        {data?.headers
                          .filter(header => hiddenColumns.has(header))
                          .map(header => (
                            <div key={header} className={styles.hiddenColumnItem}>
                              <span title={header}>{header}</span>
                              <button
                                className={styles.showColumnButton}
                                onClick={() => toggleColumnVisibility(header)}
                                title={`Show ${header} column`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                Show
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className={styles.schemaButton}
                onClick={() => setShowSchemaVisualization(true)}
                disabled={isLoading}
              >
              
                <span>View Schema</span>
              </button>
            </div>

            <div className={styles.footerRight}>
              <button
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={isLoading}              >
                Cancel
              </button>
              <button
                className={styles.uploadButton}
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Generate Insights</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <SchemaPreviewModalWrapper
        isOpen={showSchemaVisualization}
        onCloseAction={() => setShowSchemaVisualization(false)}
        tables={(parsedFiles || []).flatMap((file, fileIndex) => {
          if (!file || !files[fileIndex]) return [];

          if (files[fileIndex].type === 'excel' && file.sheets) {
            return file.sheets.map(sheet => ({
              name: `${files[fileIndex].file.name.replace(/\.[^/.]+$/, "")}_${sheet.name || 'unnamed'}`,
              fields: (sheet.headers || []).map(header => {
                if (!header) {
                  return {
                    name: 'unnamed',
                    type: 'string',
                    isPrimary: false,
                    isForeign: false,
                    references: undefined
                  };
                }
                const headerLower = header.trim().toLowerCase();
                const values = (sheet.rows || []).map(row => 
                  row ? (row[sheet.headers.indexOf(header)] || '') : ''
                );
                return {
                  name: header.trim(),
                  type: inferColumnType(values),
                  isPrimary: headerLower === 'id',
                  isForeign: false,
                  references: undefined
                };
              })
            }));
          } else {
            return [{
              name: files[fileIndex].file.name.replace(/\.[^/.]+$/, ""),
              fields: (file.headers || []).map(header => {
                if (!header) {
                  return {
                    name: 'unnamed',
                    type: 'string',
                    isPrimary: false,
                    isForeign: false,
                    references: undefined
                  };
                }
                const headerLower = header.trim().toLowerCase();
                const values = (file.rows || []).map(row => 
                  row ? (row[file.headers.indexOf(header)] || '') : ''
                );
                return {
                  name: header.trim(),
                  type: inferColumnType(values),
                  isPrimary: headerLower === 'id',
                  isForeign: false,
                  references: undefined
                };
              })
            }];
          }
        })}
      />
    </AnimatePresence>
  );
};
