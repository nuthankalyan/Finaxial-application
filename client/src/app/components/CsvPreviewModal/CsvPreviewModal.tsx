'use client';

import React, { useState, useEffect, WheelEvent, useMemo } from 'react';
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
  const [hiddenColumnsByFileSheet, setHiddenColumnsByFileSheet] = useState<Map<string, Set<string>>>(new Map());
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Get unique key for current file/sheet combination
  const getCurrentFileSheetKey = (): string => {
    const currentFile = files[activeTabIndex];
    if (!currentFile) return 'default';
    
    if (currentFile.type === 'excel') {
      const sheet = parsedFiles[activeTabIndex]?.sheets?.[selectedSheetIndex];
      return `${activeTabIndex}-${selectedSheetIndex}-${sheet?.name || 'default'}`;
    }
    
    return `${activeTabIndex}-${currentFile.file.name}`;
  };

  // Get hidden columns for current file/sheet
  const getCurrentHiddenColumns = (): Set<string> => {
    const key = getCurrentFileSheetKey();
    return hiddenColumnsByFileSheet.get(key) || new Set();
  };

  // Toggle column visibility for current file/sheet
  const toggleColumnVisibility = (header: string): void => {
    const key = getCurrentFileSheetKey();
    setHiddenColumnsByFileSheet(prev => {
      const newMap = new Map(prev);
      const currentHidden = newMap.get(key) || new Set();
      const newHidden = new Set(currentHidden);
      
      if (newHidden.has(header)) {
        newHidden.delete(header);
      } else {
        newHidden.add(header);
      }
      
      newMap.set(key, newHidden);
      return newMap;
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
    const hiddenColumns = getCurrentHiddenColumns();
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
        
        const sheets = Object.entries(excelData.sheets).map(([name, data]: [string, any]) => ({
          name,
          headers: data.headers,
          rows: data.rows
        }));
        
        return {
          headers: excelData.sheets[excelData.primarySheet].headers,
          rows: excelData.sheets[excelData.primarySheet].rows,
          sheets
        };
      } else {
        return parseCsvPreview(file.content);
      }
    });
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

  // Reset hidden columns menu when switching files/sheets
  useEffect(() => {
    setShowHiddenColumnsMenu(false);
  }, [activeTabIndex, selectedSheetIndex]);

  // Process data and handle upload
  const handleUpload = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    // Call handleConfirmAction instead of onConfirmAction directly
    // This ensures hidden columns are processed before upload
    await handleConfirmAction();
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
      setHiddenColumnsByFileSheet(new Map());
    };
  }, []);

  const data = getActiveData();
  const hiddenColumns = getCurrentHiddenColumns();
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
          const processedSheets = file.sheets.map((sheet, sheetIndex) => {
            const sheetKey = `${index}-${sheetIndex}-${sheet.name || 'default'}`;
            const sheetHiddenColumns = hiddenColumnsByFileSheet.get(sheetKey) || new Set();
            
            return {
              name: sheet.name,
              headers: sheet.headers.filter(header => !sheetHiddenColumns.has(header)),
              rows: sheet.rows.map(row => 
                row.filter((_, colIndex) => !sheetHiddenColumns.has(sheet.headers[colIndex]))
              )
            };
          });

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
          // For CSV files, get the file-specific hidden columns
          const csvKey = `${index}-${files[index].file.name}`;
          const csvHiddenColumns = hiddenColumnsByFileSheet.get(csvKey) || new Set();
          
          const visibleHeaders = file.headers.filter(header => !csvHiddenColumns.has(header));
          const visibleRows = file.rows.map(row => 
            row.filter((_, colIndex) => !csvHiddenColumns.has(file.headers[colIndex]))
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

  // Compute schema tables data with hidden columns filtered out
  const schemaTablesData = useMemo(() => {
    return (parsedFiles || []).flatMap((file, fileIndex) => {
      if (!file || !files[fileIndex]) return [];

      if (files[fileIndex].type === 'excel' && file.sheets) {
        return file.sheets.map((sheet, sheetIndex) => {
          // Get hidden columns for this specific sheet
          const sheetKey = `${fileIndex}-${sheetIndex}-${sheet.name || 'default'}`;
          const sheetHiddenColumns = hiddenColumnsByFileSheet.get(sheetKey) || new Set();
          
          // Filter out hidden columns from headers
          const visibleHeaders = (sheet.headers || []).filter(header => !sheetHiddenColumns.has(header));
          
          return {
            name: `${files[fileIndex].file.name.replace(/\.[^/.]+$/, "")}_${sheet.name || 'unnamed'}`,
            fields: visibleHeaders.map(header => {
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
              const headerIndex = sheet.headers.indexOf(header);
              const values = (sheet.rows || []).map(row => 
                row ? (row[headerIndex] || '') : ''
              );
              return {
                name: header.trim(),
                type: inferColumnType(values),
                isPrimary: headerLower === 'id',
                isForeign: false,
                references: undefined
              };
            })
          };
        });
      } else {
        // Get hidden columns for this CSV file
        const csvKey = `${fileIndex}-${files[fileIndex].file.name}`;
        const csvHiddenColumns = hiddenColumnsByFileSheet.get(csvKey) || new Set();
        
        // Filter out hidden columns from headers
        const visibleHeaders = (file.headers || []).filter(header => !csvHiddenColumns.has(header));
        
        return [{
          name: files[fileIndex].file.name.replace(/\.[^/.]+$/, ""),
          fields: visibleHeaders.map(header => {
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
            const headerIndex = file.headers.indexOf(header);
            const values = (file.rows || []).map(row => 
              row ? (row[headerIndex] || '') : ''
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
    });
  }, [parsedFiles, files, hiddenColumnsByFileSheet]);

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
              Hidden columns are specific to each file and sheet.
              {hiddenColumnsCount > 0 && ` Currently ${hiddenColumnsCount} column${hiddenColumnsCount > 1 ? 's are' : ' is'} hidden in this view.`}
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

          {/* Column Summary for Reports */}
          <div className={styles.columnSummary}>
            <div className={styles.summaryHeader}>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.summaryIcon}
              >
                <path d="M9 11l3 3 8-8"></path>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.24"></path>
              </svg>
              <span className={styles.summaryTitle}>Report Generation Summary</span>
            </div>
            <div className={styles.summaryContent}>
              {(() => {
                const visibleHeaders = data?.headers.filter(header => !hiddenColumns.has(header)) || [];
                const totalColumns = data?.headers.length || 0;
                const visibleColumns = visibleHeaders.length;
                
                return (
                  <div className={styles.summaryStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Columns to include in reports:</span>
                      <span className={styles.statValue}>
                        {visibleColumns} of {totalColumns}
                        {hiddenColumnsCount > 0 && (
                          <span className={styles.hiddenNote}>
                            ({hiddenColumnsCount} hidden)
                          </span>
                        )}
                      </span>
                    </div>
                    {visibleColumns > 0 && (
                      <div className={styles.columnsList}>
                        <span className={styles.columnsLabel}>Included columns:</span>
                        <span className={styles.columnsValues}>
                          {visibleHeaders.slice(0, 3).join(', ')}
                          {visibleHeaders.length > 3 && (
                            <span className={styles.moreColumns}>
                              {' '}and {visibleHeaders.length - 3} more
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
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
        tables={schemaTablesData}
      />
    </AnimatePresence>
  );
};
