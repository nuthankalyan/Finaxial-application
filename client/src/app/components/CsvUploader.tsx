'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CsvUploader.module.css';

interface CsvUploaderProps {
  onFileUpload: (fileContent: string, fileName: string) => void;
  isLoading: boolean;
}

export default function CsvUploader({ onFileUpload, isLoading }: CsvUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      
      // Check if file is CSV
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please upload a CSV file only');
        return;
      }
      
      setFileName(file.name);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result as string;
        onFileUpload(fileContent, file.name);
      };
      reader.onerror = () => {
        setError('Failed to read the file');
      };
      reader.readAsText(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className={styles.uploaderContainer}>
      <motion.div
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${isLoading ? styles.loading : ''}`}
        {...getRootProps()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.loadingIndicator}
            >
              <div className={styles.spinner}></div>
              <p>Analyzing your financial data...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.uploadContent}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className={styles.uploadIcon}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {fileName ? (
                <p className={styles.fileName}>{fileName}</p>
              ) : (
                <>
                  <p className={styles.mainText}>
                    {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                  </p>
                  <p className={styles.subText}>or click to browse</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error && (
        <motion.div
          className={styles.error}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
} 