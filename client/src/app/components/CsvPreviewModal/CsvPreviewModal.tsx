import React, { useState, useEffect } from 'react';
import { parseCsvPreview } from '../../utils/csvParser';
import { motion, AnimatePresence } from 'framer-motion';
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
}) => {  const [isLoading, setIsLoading] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [parsedFiles, setParsedFiles] = useState<{
    headers: string[], 
    rows: string[][],
    sheets?: { name: string; headers: string[]; rows: string[][] }[]
  }[]>([]);
  
  // Parse all files on component load
  useEffect(() => {
    const parsed = files.map(file => parseCsvPreview(file.content));
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
      // Return the selected sheet data if multi-sheet file
      return activeFile.sheets[selectedSheetIndex];
    }
    
    // Return the main file data if not multi-sheet
    return activeFile;
  };
  
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
          transition={{ type: "spring", duration: 0.3 }}
        >          <div className={styles.modalHeader}>
            <h2>
              <span className={styles.fileIcon}>
                {files.some(file => file.type === 'excel') && files.some(file => file.type === 'csv') 
                  ? '��📄' 
                  : files.some(file => file.type === 'excel') ? '📊' : '📄'}
              </span>
              Data Preview ({files.length} {files.length === 1 ? 'file' : 'files'})
            </h2>
            <button 
              className={styles.closeButton} 
              onClick={onCancel}
              aria-label="Close preview"
            >
              ×
            </button>
          </div>
            {/* Tabs for different files */}
          <div className={styles.fileTabs}>
            {files.map((file, index) => (
              <button
                key={index}
                className={`${styles.fileTab} ${activeTabIndex === index ? styles.activeTab : ''}`}
                onClick={() => setActiveTabIndex(index)}
              >
                <span className={styles.fileTypeIcon}>
                  {file.type === 'excel' ? '📊' : '📄'}
                </span>
                {file.file.name}
              </button>
            ))}
          </div>
              {/* Table display for active tab */}
          <div className={styles.tableContainer}>
            {parsedFiles.length > 0 && activeTabIndex < parsedFiles.length ? (
              <>
                {/* Sheet tabs - only show if sheets are available */}
                {parsedFiles[activeTabIndex].sheets && parsedFiles[activeTabIndex].sheets.length > 1 && (
                  <div className={styles.sheetTabs}>
                    <div className={styles.sheetTabsScroll}>
                      {parsedFiles[activeTabIndex].sheets?.map((sheet, idx) => (
                        <button
                          key={idx}
                          className={`${styles.sheetTab} ${idx === selectedSheetIndex ? styles.activeSheetTab : ''}`}
                          onClick={() => setSelectedSheetIndex(idx)}
                        >
                          {sheet.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={styles.tableWrapper}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        {getActiveSheetData().headers.map((header, index) => (
                          <th key={index}>{header.trim()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getActiveSheetData().rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className={styles.loadingTable}>Loading file preview...</div>
            )}
          </div>

          <div className={styles.modalFooter}>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
