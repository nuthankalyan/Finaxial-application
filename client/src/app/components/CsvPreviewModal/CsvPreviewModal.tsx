import React, { useState } from 'react';
import { parseCsvPreview } from '../../utils/csvParser';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CsvPreviewModal.module.css';

interface CsvPreviewModalProps {
  csvData: string;
  fileName: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
  file: File;
}

export const CsvPreviewModal: React.FC<CsvPreviewModalProps> = ({
  csvData,
  fileName,
  onConfirm,
  onCancel,
  file,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { headers, rows } = parseCsvPreview(csvData);

  const handleUpload = async () => {
    setIsLoading(true);
    await onConfirm(file);
    setIsLoading(false);
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
        >
          <div className={styles.modalHeader}>
            <h2>
              <span className={styles.fileIcon}>📄</span>
              Preview of {fileName}
            </h2>
            <button 
              className={styles.closeButton} 
              onClick={onCancel}
              aria-label="Close preview"
            >
              ×
            </button>
          </div>
          
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index}>{header.trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <span>Upload & Generate Insights</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
