import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnomalyDetectionResult, Anomaly } from '../../services/anomalyDetectionService';
import styles from './AnomalyDetectionModal.module.css';

interface AnomalyDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnomalyDetectionResult;
  onProceedWithAnomalies: () => void;
  onFixAnomalies: () => void;
  isLoading: boolean;
}

export const AnomalyDetectionModal: React.FC<AnomalyDetectionModalProps> = ({
  isOpen,
  onClose,
  result,
  onProceedWithAnomalies,
  isLoading
}) => {
  // State for selected file and sheet
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  // State for tracking open/closed issue states
  const [openIssues, setOpenIssues] = useState<Record<number, boolean>>({});
  // State for filtered anomalies based on selection
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([]);

  // Extract unique files and sheets
  const files = result?.anomalies
    ? Array.from(new Set(result.anomalies.map(a => a.file || 'Unknown').filter(Boolean)))
    : [];
    
  // Get sheets for the selected file
  const sheets = selectedFile && result?.anomalies
    ? Array.from(new Set(
        result.anomalies
          .filter(a => a.file === selectedFile)
          .map(a => a.sheet || 'Default')
          .filter(Boolean)
      ))
    : [];

  // Initialize with the first file selected
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Filter anomalies based on selected file and sheet
  useEffect(() => {
    if (!result?.anomalies) {
      setFilteredAnomalies([]);
      return;
    }

    let filtered = [...result.anomalies];
    
    if (selectedFile) {
      filtered = filtered.filter(a => a.file === selectedFile);
    }
    
    if (selectedSheet) {
      filtered = filtered.filter(a => a.sheet === selectedSheet);
    }
    
    setFilteredAnomalies(filtered);
  }, [result, selectedFile, selectedSheet]);

  // Toggle issue expansion
  const toggleIssue = (index: number) => {
    setOpenIssues(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  if (!isOpen) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '●'; // Clean circle
      case 'medium':
        return '●'; // Clean circle 
      case 'low':
        return '●'; // Clean circle
      default:
        return '⚠️';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return styles.severityHigh;
      case 'medium':
        return styles.severityMedium;
      case 'low':
        return styles.severityLow;
      default:
        return styles.severityMedium;
    }
  };

  const getAnomalyTypeLabel = (type: string) => {
    switch (type) {
      case 'outlier':
        return 'Statistical Outlier';
      case 'missing_data':
        return 'Missing Data';
      case 'inconsistent_format':
        return 'Format Inconsistency';
      case 'invalid_value':
        return 'Invalid Value';
      case 'duplicate':
        return 'Duplicate Data';
      default:
        return 'Data Issue';
    }
  };

  // Group anomalies by severity for summary statistics
  const groupedAnomalies = filteredAnomalies.reduce((groups, anomaly) => {
    const key = anomaly.severity;
    if (!groups[key]) groups[key] = [];
    groups[key].push(anomaly);
    return groups;
  }, {} as Record<string, Anomaly[]>);

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.iconContainer}>
                {result.hasAnomalies ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.warningIcon}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.checkIcon}
                  >
                    <path d="M9 11l3 3 8-8"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                )}
              </div>
              <div>
                <h2 className={styles.title}>
                  {result.hasAnomalies ? 'Data Anomalies Detected' : 'Data Quality Check Complete'}
                </h2>
                <p className={styles.subtitle}>{result.summary}</p>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            {result.hasAnomalies ? (
              <>
                <div className={styles.summaryStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{filteredAnomalies.length}</span>
                    <span className={styles.statLabel}>
                      {selectedFile ? (selectedSheet ? `Issues in Sheet` : `Issues in File`) : 'Total Issues'}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {groupedAnomalies.high?.length || 0}
                    </span>
                    <span className={styles.statLabel}>High Priority</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {groupedAnomalies.medium?.length || 0}
                    </span>
                    <span className={styles.statLabel}>Medium Priority</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {groupedAnomalies.low?.length || 0}
                    </span>
                    <span className={styles.statLabel}>Low Priority</span>
                  </div>
                </div>

                {/* File selection tabs */}
                {files.length > 0 && (
                  <div className={styles.tabsContainer}>
                    <div className={styles.tabsLabel}>Files:</div>
                    <div className={styles.tabsScrollArea}>
                      {files.map((file, index) => (
                        <button
                          key={file}
                          className={`${styles.tabButton} ${selectedFile === file ? styles.active : ''}`}
                          onClick={() => {
                            setSelectedFile(file);
                            setSelectedSheet(null);
                          }}
                        >
                          {file.split('/').pop() || `File ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sheet selection tabs - only show if a file is selected and it has sheets */}
                {sheets.length > 0 && (
                  <div className={styles.tabsContainer}>
                    <div className={styles.tabsLabel}>Sheets:</div>
                    <div className={styles.tabsScrollArea}>
                      {sheets.map((sheet) => (
                        <button
                          key={sheet}
                          className={`${styles.tabButton} ${selectedSheet === sheet ? styles.active : ''}`}
                          onClick={() => setSelectedSheet(sheet)}
                        >
                          {sheet}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible Issues List */}
                <div className={styles.issuesContainer}>
                  {filteredAnomalies.length > 0 ? (
                    filteredAnomalies.map((anomaly, index) => (
                      <div 
                        key={index} 
                        className={`${styles.issueAccordion} ${getSeverityClass(anomaly.severity)}`}
                      >
                        <div 
                          className={styles.issueHeader}
                          onClick={() => toggleIssue(index)}
                        >
                          <div className={styles.issueHeaderContent}>
                            <span className={styles.issueSeverityIndicator}>
                              {getSeverityIcon(anomaly.severity)}
                            </span>
                            <span className={styles.issueTitle}>
                              {getAnomalyTypeLabel(anomaly.type)}
                              {anomaly.row && (
                                <span className={styles.issueLocation}>
                                  {` • Row ${anomaly.row}, Col "${anomaly.column}"`}
                                </span>
                              )}
                            </span>
                          </div>
                          <svg
                            className={`${styles.chevronIcon} ${openIssues[index] ? styles.open : ''}`}
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                        
                        {openIssues[index] && (
                          <div className={styles.issueContent}>
                            <div className={styles.issueDescription}>
                              {anomaly.description}
                            </div>
                            
                            {anomaly.value && (
                              <div className={styles.issueValue}>
                                <strong>Value:</strong> "{anomaly.value}"
                              </div>
                            )}
                            
                            {anomaly.suggestion && (
                              <div className={styles.issueSuggestion}>
                                <strong>Suggestion:</strong> {anomaly.suggestion}
                              </div>
                            )}
                            
                            <div className={styles.issueMetadata}>
                              <span className={styles.issueFile}>
                                File: {anomaly.file || 'Unknown'}
                              </span>
                              {anomaly.sheet && anomaly.sheet !== 'default' && (
                                <span className={styles.issueSheet}>
                                  Sheet: {anomaly.sheet}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.noIssuesMessage}>
                      No issues found for the selected file or sheet.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.cleanDataMessage}>
                <div className={styles.cleanDataIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    width="48"
                    height="48"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 11l3 3 8-8"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </div>
                <h3 className={styles.cleanDataTitle}>No Anomalies Detected</h3>
                <p className={styles.cleanDataDescription}>
                  Your data appears to be clean and ready for analysis. No significant data quality issues were found.
                </p>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              className={styles.proceedButton}
              onClick={onProceedWithAnomalies}
              disabled={isLoading}
            >
              Proceed with Insight Generation
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
