import React from 'react';
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
  onFixAnomalies,
  isLoading
}) => {
  if (!isOpen) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
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

  const groupedAnomalies = result.anomalies.reduce((groups, anomaly) => {
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
                    <span className={styles.statNumber}>{result.anomalies.length}</span>
                    <span className={styles.statLabel}>Issues Found</span>
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

                <div className={styles.anomaliesList}>
                  {['high', 'medium', 'low'].map(severity => {
                    const anomalies = groupedAnomalies[severity];
                    if (!anomalies?.length) return null;

                    return (
                      <div key={severity} className={styles.severityGroup}>
                        <h3 className={`${styles.severityHeader} ${getSeverityClass(severity)}`}>
                          {getSeverityIcon(severity)} {severity.charAt(0).toUpperCase() + severity.slice(1)} Priority
                          ({anomalies.length})
                        </h3>
                        <div className={styles.anomalyItems}>
                          {anomalies.slice(0, 10).map((anomaly, index) => (
                            <div key={index} className={`${styles.anomalyItem} ${getSeverityClass(severity)}`}>
                              <div className={styles.anomalyHeader}>
                                <span className={styles.anomalyType}>
                                  {getAnomalyTypeLabel(anomaly.type)}
                                </span>
                                {anomaly.row && (
                                  <span className={styles.anomalyLocation}>
                                    Row {anomaly.row}, Column "{anomaly.column}"
                                  </span>
                                )}
                              </div>
                              <p className={styles.anomalyDescription}>
                                {anomaly.description}
                              </p>
                              {anomaly.value && (
                                <div className={styles.anomalyValue}>
                                  <strong>Value:</strong> "{anomaly.value}"
                                </div>
                              )}
                              {anomaly.suggestion && (
                                <div className={styles.anomalySuggestion}>
                                  <strong>Suggestion:</strong> {anomaly.suggestion}
                                </div>
                              )}
                            </div>
                          ))}
                          {anomalies.length > 10 && (
                            <div className={styles.moreAnomalies}>
                              +{anomalies.length - 10} more {severity} priority issues...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.actionPrompt}>
                  <p className={styles.promptText}>
                    Would you like to correct these anomalies before generating insights, or proceed with the current data?
                  </p>
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
            {result.hasAnomalies ? (
              <>
                <button
                  className={styles.fixButton}
                  onClick={onFixAnomalies}
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
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                    <path d="M13 12h1l2-2-2-2h-1v4z"></path>
                    <path d="M11 12H9l-2-2 2-2h2v4z"></path>
                  </svg>
                  Fix Anomalies First
                </button>
                <button
                  className={styles.proceedButton}
                  onClick={onProceedWithAnomalies}
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
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                  Proceed with Insight Generation
                </button>
              </>
            ) : (
              <button
                className={styles.proceedButton}
                onClick={onProceedWithAnomalies}
                disabled={isLoading}
              >
                Proceed with Insight Generation
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
