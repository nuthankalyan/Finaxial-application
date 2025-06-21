import React, { useState, useEffect } from 'react';
import { parseCsvPreview } from '../../utils/csvParser';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaPreviewModalWrapper } from '../SchemaPreviewModal/SchemaPreviewModalWrapper';
import { prepareTableSchemas } from '../../utils/tableSchemaPreparation';
import { inferColumnType } from '../../utils/typeInference';
import styles from './CsvPreviewModal.module.css';

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

  const handleUpload = async () => {
    setIsLoading(true);
    try {
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
                )}
                <div className={styles.tableWrapper}>
                  {activeData && activeData.headers ? (
                    <table className={styles.previewTable}>
                      <thead>
                        <tr>
                          {activeData.headers.map((header, index) => (
                            <th key={index}>{header ? header.trim() : ''}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeData.rows && activeData.rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}
                          >
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell || ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.noData}>No data available</div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.loadingTable}>Loading file preview...</div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              <button
                className={styles.schemaButton}
                onClick={() => setShowSchemaVisualization(true)}
                disabled={isLoading}
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
                  <>
                    <span>Generate Insights</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Schema Visualization Modal */}      <SchemaPreviewModalWrapper
        isOpen={showSchemaVisualization}
        onCloseAction={() => setShowSchemaVisualization(false)}
        tables={(parsedFiles || []).flatMap((file, fileIndex) => {
          if (!file || !files[fileIndex]) {
            return [];
          }
          if (files[fileIndex].type === 'excel' && file.sheets) {
            // Create tables for each sheet in Excel files
            return file.sheets.map(sheet => ({              name: `${files[fileIndex].file.name.replace(/\.[^/.]+$/, "")}_${sheet.name || 'unnamed'}`,
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
          } else {            // Create a single table for CSV files
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
