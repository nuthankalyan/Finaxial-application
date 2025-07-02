import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DataTransformation, 
  TransformationRule, 
  dataTransformationService 
} from '../../services/dataTransformationService';
import styles from './DataTransformationModal.module.css';

interface DataTransformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { headers: string[]; rows: string[][] };
  onApplyTransformations: (transformedData: { headers: string[]; rows: string[][] }) => void;
  isLoading: boolean;
}

export const DataTransformationModal: React.FC<DataTransformationModalProps> = ({
  isOpen,
  onClose,
  data,
  onApplyTransformations,
  isLoading
}) => {
  const [availableTransformations, setAvailableTransformations] = useState<DataTransformation[]>([]);
  const [selectedTransformations, setSelectedTransformations] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'preview'>('select');
  const [customRules, setCustomRules] = useState<Partial<TransformationRule>>({});

  useEffect(() => {
    if (isOpen && data) {
      const transformations = dataTransformationService.getAvailableTransformations(data.headers, data.rows);
      setAvailableTransformations(transformations);
    }
  }, [isOpen, data]);

  const handleTransformationToggle = (transformationId: string) => {
    setSelectedTransformations(prev => 
      prev.includes(transformationId)
        ? prev.filter(id => id !== transformationId)
        : [...prev, transformationId]
    );
  };

  const generateTransformationRules = (): TransformationRule[] => {
    const rules: TransformationRule[] = [];

    selectedTransformations.forEach(transformationId => {
      switch (transformationId) {
        case 'remove_duplicates':
          rules.push({
            id: 'remove_duplicates',
            type: 'remove_duplicates',
            parameters: {},
            description: 'Remove duplicate rows'
          });
          break;

        case 'trim_whitespace':
          rules.push({
            id: 'trim_whitespace',
            type: 'replace',
            parameters: { 
              findValue: /^\s+|\s+$/g, 
              replaceValue: '',
              isRegex: true 
            },
            description: 'Trim whitespace from all cells'
          });
          break;

        case 'remove_empty_rows':
          rules.push({
            id: 'remove_empty_rows',
            type: 'filter_rows',
            parameters: {
              operator: 'not_empty',
              column: data.headers[0] // Use first column as reference
            },
            description: 'Remove empty rows'
          });
          break;

        case 'fill_missing_values':
          rules.push({
            id: 'fill_missing_values',
            type: 'fill_missing',
            parameters: { fillValue: '0' },
            description: 'Fill missing values with default values'
          });
          break;

        case 'standardize_numbers':
          data.headers.forEach(header => {
            if (/amount|price|cost|value|total|sum/i.test(header)) {
              rules.push({
                id: `standardize_${header}`,
                type: 'convert_type',
                column: header,
                parameters: { targetType: 'number' },
                description: `Standardize number format for ${header}`
              });
            }
          });
          break;

        case 'normalize_text_case':
          data.headers.forEach(header => {
            if (/name|description|category|type/i.test(header)) {
              rules.push({
                id: `normalize_${header}`,
                type: 'replace',
                column: header,
                parameters: { 
                  transform: 'title_case'
                },
                description: `Normalize text case for ${header}`
              });
            }
          });
          break;

        default:
          break;
      }
    });

    return rules;
  };

  const handlePreview = async () => {
    if (selectedTransformations.length === 0) return;

    setIsApplying(true);
    try {
      const rules = generateTransformationRules();
      const result = await dataTransformationService.applyTransformations(
        data.headers,
        data.rows,
        rules
      );

      if (result.success) {
        setPreviewData(result.transformedData);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApply = async () => {
    if (!previewData) {
      await handlePreview();
      return;
    }

    setIsApplying(true);
    try {
      onApplyTransformations(previewData);
      onClose();
    } catch (error) {
      console.error('Error applying transformations:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleanup':
        return '🧹';
      case 'format':
        return '📐';
      case 'calculate':
        return '🧮';
      case 'filter':
        return '🔍';
      default:
        return '⚙️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cleanup':
        return styles.categoryCleanup;
      case 'format':
        return styles.categoryFormat;
      case 'calculate':
        return styles.categoryCalculate;
      case 'filter':
        return styles.categoryFilter;
      default:
        return styles.categoryDefault;
    }
  };

  if (!isOpen) return null;

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
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.transformIcon}
                >
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                  <path d="M13 12h1l2-2-2-2h-1v4z"></path>
                  <path d="M11 12H9l-2-2 2-2h2v4z"></path>
                </svg>
              </div>
              <div>
                <h2 className={styles.title}>Transform Data</h2>
                <p className={styles.subtitle}>
                  Clean and transform your data before analysis
                </p>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              disabled={isLoading || isApplying}
            >
              ×
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'select' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('select')}
              disabled={isApplying}
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
                <path d="M9 11l3 3 8-8"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              Select Transformations
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'preview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('preview')}
              disabled={!previewData || isApplying}
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
              Preview Results
              {previewData && <span className={styles.tabBadge}>Ready</span>}
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'select' ? (
              <div className={styles.transformationsList}>
                <div className={styles.summary}>
                  <p className={styles.summaryText}>
                    We found {availableTransformations.length} applicable transformation{availableTransformations.length !== 1 ? 's' : ''} for your data.
                    Select the ones you'd like to apply:
                  </p>
                </div>

                <div className={styles.transformationGroups}>
                  {['cleanup', 'format', 'calculate', 'filter'].map(category => {
                    const categoryTransformations = availableTransformations.filter(t => t.category === category);
                    if (categoryTransformations.length === 0) return null;

                    return (
                      <div key={category} className={styles.transformationGroup}>
                        <h3 className={`${styles.categoryHeader} ${getCategoryColor(category)}`}>
                          {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                          <span className={styles.categoryCount}>({categoryTransformations.length})</span>
                        </h3>
                        <div className={styles.transformationItems}>
                          {categoryTransformations.map(transformation => (
                            <div
                              key={transformation.id}
                              className={`${styles.transformationItem} ${
                                selectedTransformations.includes(transformation.id) ? styles.selected : ''
                              }`}
                            >
                              <label className={styles.transformationLabel}>
                                <input
                                  type="checkbox"
                                  checked={selectedTransformations.includes(transformation.id)}
                                  onChange={() => handleTransformationToggle(transformation.id)}
                                  className={styles.checkbox}
                                />
                                <div className={styles.transformationInfo}>
                                  <h4 className={styles.transformationName}>
                                    {transformation.name}
                                  </h4>
                                  <p className={styles.transformationDescription}>
                                    {transformation.description}
                                  </p>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedTransformations.length > 0 && (
                  <div className={styles.selectedSummary}>
                    <h4 className={styles.selectedTitle}>
                      Selected Transformations ({selectedTransformations.length})
                    </h4>
                    <div className={styles.selectedItems}>
                      {selectedTransformations.map(id => {
                        const transformation = availableTransformations.find(t => t.id === id);
                        return transformation ? (
                          <span key={id} className={`${styles.selectedChip} ${getCategoryColor(transformation.category)}`}>
                            {getCategoryIcon(transformation.category)} {transformation.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.previewContainer}>
                {previewData ? (
                  <>
                    <div className={styles.previewHeader}>
                      <h3 className={styles.previewTitle}>
                        Transformation Preview
                      </h3>
                      <div className={styles.previewStats}>
                        <span className={styles.previewStat}>
                          <strong>Rows:</strong> {data.rows.length} → {previewData.rows.length}
                        </span>
                        <span className={styles.previewStat}>
                          <strong>Columns:</strong> {data.headers.length} → {previewData.headers.length}
                        </span>
                      </div>
                    </div>
                    <div className={styles.previewTable}>
                      <table>
                        <thead>
                          <tr>
                            {previewData.headers.map((header, index) => (
                              <th key={index}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.rows.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.rows.length > 10 && (
                        <div className={styles.previewNote}>
                          Showing first 10 rows of {previewData.rows.length} total rows
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={styles.noPreview}>
                    <svg
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.noPreviewIcon}
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <h3 className={styles.noPreviewTitle}>No Preview Available</h3>
                    <p className={styles.noPreviewDescription}>
                      Select transformations and generate a preview to see the results.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            {activeTab === 'select' ? (
              <>
                <button
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={isApplying}
                >
                  Cancel
                </button>
                <button
                  className={styles.previewButton}
                  onClick={handlePreview}
                  disabled={selectedTransformations.length === 0 || isApplying}
                >
                  {isApplying ? (
                    <>
                      <span className={styles.spinner}></span>
                      Generating Preview...
                    </>
                  ) : (
                    <>
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
                      Generate Preview
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.backButton}
                  onClick={() => setActiveTab('select')}
                  disabled={isApplying}
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
                    <path d="M19 12H5"></path>
                    <path d="M12 19l-7-7 7-7"></path>
                  </svg>
                  Back to Selection
                </button>
                <button
                  className={styles.applyButton}
                  onClick={handleApply}
                  disabled={!previewData || isApplying}
                >
                  {isApplying ? (
                    <>
                      <span className={styles.spinner}></span>
                      Applying...
                    </>
                  ) : (
                    <>
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
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                      Apply Transformations
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
