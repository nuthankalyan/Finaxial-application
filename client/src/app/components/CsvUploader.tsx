'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { CsvPreviewModal } from './CsvPreviewModal/CsvPreviewModal';
import { LoadingOverlay } from './LoadingOverlay/LoadingOverlay';
import { parseExcelFile } from '../utils/excelParser';
import { datasetService } from '../services/datasetService';
import { Notification } from './Notification/Notification';
import { Dataset } from '../types/datasetVersions';
import { DatasetVersions } from './DatasetVersions/DatasetVersions';
import styles from './CsvUploader.module.css';

interface FileData {
  content: string;
  file: File;
  type: 'csv' | 'excel';
}

interface CsvUploaderProps {
  onFileUploadAction: (filesContent: { content: string; fileName: string }[]) => void;
  isLoading: boolean;
}

export default function CsvUploader({ onFileUploadAction, isLoading }: CsvUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number | undefined>();
  const [currentDataset, setCurrentDataset] = useState<Dataset | undefined>();
  const [showVersions, setShowVersions] = useState(false);
  
  // Loading states for animated text
  const loadingMessages = ["Analysing", "Visualizing", "Crafting", "Preparing assistant","Generating reports"];
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [isMessageChanging, setIsMessageChanging] = useState(false);

  // Effect to rotate loading messages while in loading state
  useEffect(() => {
    if (!isLoading) return;
    
    const messageInterval = setInterval(() => {
      setIsMessageChanging(true);
      setTimeout(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
        setIsMessageChanging(false);
      }, 500); // Wait for exit animation before changing message
    }, 2500); // Change message every 2.5 seconds
    
    return () => clearInterval(messageInterval);
  }, [isLoading, loadingMessages.length]);

  const handleConfirmUpload = useCallback(async (): Promise<void> => {
    if (uploadedFiles.length > 0) {
      try {
        const results = await Promise.all(uploadedFiles.map(async file => {
          const uploadResult = await datasetService.uploadDataset(
            file.content,
            file.file.name,
            file.type,
            'current-user-id' // In a real app, get this from auth context
          );

          return {
            content: file.content,
            fileName: file.file.name,
            sheets: file.type === 'excel' ? JSON.parse(file.content).sheets : undefined,
            uploadResult
          };
        }));

        // Show notification for the last uploaded file
        const lastResult = results[results.length - 1].uploadResult;
        setCurrentDataset(lastResult.dataset);
        setCurrentVersion(lastResult.version);
        setNotificationMessage(
          `Data ${lastResult.isNewDataset ? 'uploaded' : 'updated'} successfully${lastResult.version ? ` – Version ${lastResult.version} added` : ''}`
        );
        setShowNotification(true);

        // Prepare files for the existing onFileUploadAction
        const filesForUpload = results.map(result => ({
          content: result.content,
          fileName: result.fileName,
          sheets: result.sheets
        }));

        setShowPreview(false);
        await onFileUploadAction(filesForUpload);
        setUploadedFiles([]);

        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      } catch (error) {
        console.error('Error uploading files:', error);
        setError('Failed to upload files. Please try again.');
      }
    }
  }, [uploadedFiles, onFileUploadAction]);

  const handleCancelUpload = useCallback(() => {
    setShowPreview(false);
  }, []);
  
  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      
      // Filter supported files (CSV & Excel)
      const supportedFiles = acceptedFiles.filter(file => 
        file.type === 'text/csv' || 
        file.name.toLowerCase().endsWith('.csv') || 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.name.toLowerCase().endsWith('.xlsx')
      );
      
      if (supportedFiles.length === 0) {
        setError('Please upload CSV or Excel (.xlsx) files only');
        return;
      }
      
      if (supportedFiles.length !== acceptedFiles.length) {
        setError('Some files were rejected. Only CSV and Excel (.xlsx) files are accepted.');
      }
      
      // Process each file
      Promise.all(supportedFiles.map(file => {
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                       file.name.toLowerCase().endsWith('.xlsx');
        
        return new Promise<FileData>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            if (isExcel) {
              try {
                // For Excel files
                const arrayBuffer = reader.result as ArrayBuffer;
                const excelData = parseExcelFile(arrayBuffer);
                
                // Store the Excel data as a JSON string to preserve sheet structure
                resolve({ 
                  content: JSON.stringify(excelData), 
                  file, 
                  type: 'excel'
                });
              } catch (error) {
                reject(new Error(`Failed to parse Excel file: ${file.name}`));
              }
            } else {
              // For CSV files
              const fileContent = reader.result as string;
              resolve({ 
                content: fileContent, 
                file,
                type: 'csv' 
              });
            }
          };
          
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          
          if (isExcel) {
            reader.readAsArrayBuffer(file);
          } else {
            reader.readAsText(file);
          }
        });
      }))
      .then(results => {
        setUploadedFiles(prev => [...prev, ...results]);
        setShowPreview(true);
      })
      .catch(err => {
        setError(err.message);
      });
    },
    []
  );  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
    disabled: isLoading,
    noClick: false,
    noKeyboard: false,
    noDrag: false,
    noDragEventsBubbling: false,
  });

  // We need to handle the drag events ourselves to make it work with motion.div
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isLoading && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onDrop(Array.from(event.dataTransfer.files));
    }
  };

  return (
    <div className={styles.uploaderContainer}>
      {showPreview && uploadedFiles.length > 0 && (
        <CsvPreviewModal
          files={uploadedFiles}
          onConfirmAction={handleConfirmUpload}
          onCancelAction={handleCancelUpload}
        />
      )}

      <motion.div
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${
          isLoading ? styles.loading : ''
        }`}
        {...getRootProps({
          onClick: undefined,
        })}
        onClick={!isLoading ? getRootProps().onClick : undefined}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
              <div className={styles.loadingMessageContainer}>
                <motion.p
                  key={currentLoadingMessage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={styles.loadingMessage}
                >
                  {loadingMessages[currentLoadingMessage]}
                </motion.p>
              </div>
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
              {uploadedFiles.length > 0 ? (
                <div className={styles.filesList}>
                  <p className={styles.uploadedFilesTitle}>
                    {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} ready
                    <span className={styles.fileTypesInfo}>
                      ({uploadedFiles.filter(f => f.type === 'csv').length} CSV, {uploadedFiles.filter(f => f.type === 'excel').length} Excel)
                    </span>
                  </p>
                  <ul className={styles.fileNamesList}>
                    {uploadedFiles.slice(0, 3).map((file, index) => (
                      <li key={index} className={styles.fileNameItem}>
                        <span className={styles.fileName}>{file.file.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          className={styles.removeFileBtn}
                          aria-label={`Remove ${file.file.name}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                    {uploadedFiles.length > 3 && (
                      <li className={styles.moreFiles}>
                        +{uploadedFiles.length - 3} more {uploadedFiles.length - 3 === 1 ? 'file' : 'files'}
                      </li>
                    )}
                  </ul>
                  <p className={styles.dragMoreText}>Drag more files or click to browse</p>
                </div>
              ) : (
                <>
                  <p className={styles.mainText}>
                    {isDragActive ? 'Drop your files here' : 'Drag & drop your CSV or Excel files here'}
                  </p>
                  <p className={styles.subText}>or click to browse (CSV and XLSX formats supported)</p>
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

      {uploadedFiles.length > 0 && (
        <motion.div
          className={styles.generateButtonContainer}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            className={styles.generateButton}
            onClick={() => setShowPreview(true)}
            disabled={isLoading}
          >
            Preview & Generate Insights
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.generateIcon}
            >
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </motion.div>
      )}

      {currentDataset && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.showVersionsButton}
        >
          <button onClick={() => setShowVersions(!showVersions)}>
            {showVersions ? 'Hide Versions' : 'Show Versions'}
          </button>
        </motion.div>
      )}

      {currentDataset && showVersions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.versionsContainer}
        >
          <DatasetVersions 
            dataset={currentDataset} 
            onVersionDelete={(success, updatedDataset) => {
              if (success && updatedDataset) {
                setCurrentDataset(updatedDataset);
                setCurrentVersion(updatedDataset.currentVersion);
                setNotificationMessage("Version deleted successfully");
                setShowNotification(true);
                setTimeout(() => {
                  setShowNotification(false);
                }, 3000);
              } else {
                setError("Cannot delete the last version of a dataset");
                setTimeout(() => {
                  setError(null);
                }, 3000);
              }
            }}
          />
        </motion.div>
      )}

      <Notification
        message={notificationMessage}
        version={currentVersion}
        isVisible={showNotification}
        type="success"
      />
    </div>
  );
}