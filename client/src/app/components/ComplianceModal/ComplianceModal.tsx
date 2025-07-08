'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ComplianceModal.module.css';
import type { ComplianceResult, ComplianceViolation } from '../../services/complianceService';
import { complianceService } from '../../services/complianceService';

interface ComplianceModalProps {
  isOpen: boolean;
  result: ComplianceResult | null;
  fileName?: string;
  onCloseAction: () => void;
  onExportReportAction: (report: string) => void;
}

export default function ComplianceModal({
  isOpen,
  result,
  fileName,
  onCloseAction,
  onExportReportAction
}: ComplianceModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'recommendations' | 'files'>('overview');
  const [showOnlyNonCompliant, setShowOnlyNonCompliant] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !result) return null;

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Generate and download PDF report
      complianceService.generateCompliancePdfReport(result, fileName);
    } catch (error) {
      console.error('Error exporting compliance PDF report:', error);
      // Fallback to text export if PDF fails
      try {
        const report = complianceService.generateComplianceReport(result, fileName);
        onExportReportAction(report);
      } catch (fallbackError) {
        console.error('Error with fallback text export:', fallbackError);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCloseAction();
    }
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return (
          <svg className={styles.criticalIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className={styles.warningIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        );
      case 'info':
        return (
          <svg className={styles.infoIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getStandardBadgeClass = (standard: string) => {
    switch (standard) {
      case 'GAAP':
        return styles.gaapBadge;
      case 'IFRS':
        return styles.ifrsBadge;
      case 'SOX':
        return styles.soxBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const filteredViolations = showOnlyNonCompliant 
    ? result.violations.filter(v => v.severity === 'critical' || v.severity === 'warning')
    : result.violations;

  const criticalCount = result.violations.filter(v => v.severity === 'critical').length;
  const warningCount = result.violations.filter(v => v.severity === 'warning').length;
  const infoCount = result.violations.filter(v => v.severity === 'info').length;

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
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerContent}>
              <div className={styles.complianceStatus}>
                {result.isCompliant ? (
                  <div className={styles.compliantBanner}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span>✓ All compliance checks passed</span>
                  </div>
                ) : (
                  <div className={styles.nonCompliantBanner}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    <span>⚠ Compliance issues found. See details below.</span>
                  </div>
                )}
              </div>
              <h2 className={styles.modalTitle}>
                Financial Compliance Report
                {fileName && <span className={styles.fileName}> - {fileName}</span>}
              </h2>
            </div>
            <button onClick={onCloseAction} className={styles.closeButton}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Compliance Summary Stats */}
          <div className={styles.summaryStats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{result.totalChecks}</div>
              <div className={styles.statLabel}>Total Checks</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.passed}`}>{result.passedChecks}</div>
              <div className={styles.statLabel}>Passed</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.failed}`}>{result.failedChecks}</div>
              <div className={styles.statLabel}>Failed</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.critical}`}>{criticalCount}</div>
              <div className={styles.statLabel}>Critical</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.warning}`}>{warningCount}</div>
              <div className={styles.statLabel}>Warnings</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'violations' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('violations')}
            >
              Violations ({result.violations.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'recommendations' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
            </button>
            {result.fileResults && result.aggregatedResult && (
              <button
                className={`${styles.tab} ${activeTab === 'files' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files ({result.fileResults.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <div className={styles.overviewContent}>
                <div className={styles.executiveSummary}>
                  <h3>Executive Summary</h3>
                  <p>{result.executiveReport}</p>
                </div>
                
                <div className={styles.complianceBreakdown}>
                  <h3>Compliance Standards Checked</h3>
                  <div className={styles.standardsGrid}>
                    <div className={styles.standardCard}>
                      <div className={`${styles.standardBadge} ${styles.gaapBadge}`}>GAAP</div>
                      <div className={styles.standardInfo}>
                        <div className={styles.standardTitle}>Generally Accepted Accounting Principles</div>
                        <div className={styles.standardDescription}>
                          US accounting standards for revenue recognition, matching principle, and consistency
                        </div>
                      </div>
                    </div>
                    <div className={styles.standardCard}>
                      <div className={`${styles.standardBadge} ${styles.ifrsBadge}`}>IFRS</div>
                      <div className={styles.standardInfo}>
                        <div className={styles.standardTitle}>International Financial Reporting Standards</div>
                        <div className={styles.standardDescription}>
                          Global standards for fair value measurement, substance over form, and comparability
                        </div>
                      </div>
                    </div>
                    <div className={styles.standardCard}>
                      <div className={`${styles.standardBadge} ${styles.soxBadge}`}>SOX</div>
                      <div className={styles.standardInfo}>
                        <div className={styles.standardTitle}>Sarbanes-Oxley Act</div>
                        <div className={styles.standardDescription}>
                          Internal controls, data accuracy, segregation of duties, and documentation requirements
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'violations' && (
              <div className={styles.violationsContent}>
                <div className={styles.violationsHeader}>
                  <div className={styles.violationsCount}>
                    {result.violations.length} violation{result.violations.length !== 1 ? 's' : ''} found
                  </div>
                  <div className={styles.violationsControls}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={showOnlyNonCompliant}
                        onChange={(e) => setShowOnlyNonCompliant(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                      <span className={styles.toggleLabel}>Only non-compliant rows</span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.violationsList}>
                  {filteredViolations.length === 0 ? (
                    <div className={styles.noViolations}>
                      {showOnlyNonCompliant ? 
                        'No critical or warning violations found.' : 
                        'No compliance violations detected.'
                      }
                    </div>
                  ) : (
                    filteredViolations.map((violation, index) => (
                      <div key={index} className={`${styles.violationCard} ${styles[violation.severity]}`}>
                        <div className={styles.violationHeader}>
                          <div className={styles.violationSeverity}>
                            {getSeverityIcon(violation.severity)}
                            <span className={styles.severityText}>{violation.severity.toUpperCase()}</span>
                          </div>
                          <div className={`${styles.standardBadge} ${getStandardBadgeClass(violation.rule.standard)}`}>
                            {violation.rule.standard}
                          </div>
                        </div>
                        
                        <div className={styles.violationContent}>
                          <div className={styles.violationTitle}>{violation.rule.category}</div>
                          <div className={styles.violationMessage}>{violation.message}</div>
                          
                          {(violation.row > 0 || violation.column) && (
                            <div className={styles.violationLocation}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              {violation.row > 0 ? `Row ${violation.row}` : ''}
                              {violation.row > 0 && violation.column ? ', ' : ''}
                              {violation.column ? `Column ${violation.column}` : ''}
                              {violation.value && (
                                <>
                                  <span className={styles.violationValue}>: "{violation.value}"</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          {violation.suggestion && (
                            <div className={styles.violationSuggestion}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5Z"/>
                              </svg>
                              <strong>Suggestion:</strong> {violation.suggestion}
                            </div>
                          )}
                          
                          <div className={styles.violationRule}>
                            <strong>Rule:</strong> {violation.rule.description}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className={styles.recommendationsContent}>
                <h3>Recommended Actions</h3>
                <div className={styles.recommendationsList}>
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className={styles.recommendationCard}>
                      <div className={styles.recommendationNumber}>{index + 1}</div>
                      <div className={styles.recommendationText}>{recommendation}</div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.auditReadiness}>
                  <h3>Audit Readiness Assessment</h3>
                  <p>{result.summary}</p>
                </div>
              </div>
            )}

            {activeTab === 'files' && result.fileResults && (
              <div className={styles.filesContent}>
                <h3>File-by-File Analysis</h3>
                <div className={styles.filesList}>
                  {result.fileResults.map((fileResult, index) => (
                    <div key={index} className={`${styles.fileCard} ${fileResult.isCompliant ? styles.compliantFile : styles.nonCompliantFile}`}>
                      <div className={styles.fileHeader}>
                        <div className={styles.fileName}>
                          📄 {fileResult.fileName}
                          {fileResult.sheetName && <span className={styles.sheetName}> - {fileResult.sheetName}</span>}
                        </div>
                        <div className={`${styles.fileStatus} ${fileResult.isCompliant ? styles.statusCompliant : styles.statusNonCompliant}`}>
                          {fileResult.isCompliant ? '✓ Compliant' : '⚠ Issues Found'}
                        </div>
                      </div>
                      
                      <div className={styles.fileStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Checks:</span>
                          <span className={styles.statValue}>{fileResult.checkCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Passed:</span>
                          <span className={styles.statValue}>{fileResult.passedCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Failed:</span>
                          <span className={styles.statValue}>{fileResult.failedCount}</span>
                        </div>
                      </div>

                      {fileResult.violations.length > 0 && (
                        <div className={styles.fileViolations}>
                          <h4>Issues Found:</h4>
                          {fileResult.violations.slice(0, 3).map((violation, violationIndex) => (
                            <div key={violationIndex} className={`${styles.violationSummary} ${styles[`severity-${violation.severity}`]}`}>
                              <div className={styles.violationSeverity}>
                                {getSeverityIcon(violation.severity)}
                              </div>
                              <div className={styles.violationSummaryText}>
                                <div className={styles.violationMessage}>{violation.message.replace(/^\[.*?\]\s*/, '')}</div>
                                <div className={styles.violationRule}>{violation.rule.standard} - {violation.rule.category}</div>
                              </div>
                            </div>
                          ))}
                          {fileResult.violations.length > 3 && (
                            <div className={styles.moreViolations}>
                              +{fileResult.violations.length - 3} more issues
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              <div className={styles.lastChecked}>
                Last checked: {new Date().toLocaleString()}
              </div>
            </div>
            <div className={styles.footerRight}>
              <button
                className={styles.exportButton}
                onClick={handleExportReport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className={styles.spinner}></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span>Export PDF Report</span>
                  </>
                )}
              </button>
              <button className={styles.closeButtonFooter} onClick={onCloseAction}>
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
