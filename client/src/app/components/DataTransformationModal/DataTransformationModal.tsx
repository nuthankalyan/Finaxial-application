import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DataTransformation, 
  TransformationRule, 
  dataTransformationService 
} from '../../services/dataTransformationService';
import { 
  anomalyDetectionService, 
  Anomaly, 
  AnomalyDetectionResult 
} from '../../services/anomalyDetectionService';
import styles from './DataTransformationModal.module.css';

interface DataTransformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { headers: string[]; rows: string[][] };
  onApplyTransformations: (
    transformedData: { headers: string[]; rows: string[][] },
    additionalTransformedFiles?: {
      fileName: string;
      sheetName?: string;
      data: { headers: string[]; rows: string[][] };
    }[]
  ) => void;
  isLoading: boolean;
  fileInfo?: {
    fileName: string;
    sheetName?: string;
  };
  additionalFiles?: {
    fileName: string;
    sheetName?: string;
    data: { headers: string[]; rows: string[][] };
  }[];
}

export const DataTransformationModal: React.FC<DataTransformationModalProps> = ({
  isOpen,
  onClose,
  data,
  onApplyTransformations,
  isLoading,
  fileInfo,
  additionalFiles
}) => {
  const [availableTransformations, setAvailableTransformations] = useState<DataTransformation[]>([]);
  const [selectedTransformations, setSelectedTransformations] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'preview' | 'anomalies'>('anomalies');
  const [customRules, setCustomRules] = useState<Partial<TransformationRule>>({});
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [anomalyDetectionResult, setAnomalyDetectionResult] = useState<AnomalyDetectionResult | null>(null);
  const [recommendedTransformations, setRecommendedTransformations] = useState<string[]>([]);
  const [customAnomalyFixes, setCustomAnomalyFixes] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDetectingAnomalies, setIsDetectingAnomalies] = useState<boolean>(false);
  const [currentFileData, setCurrentFileData] = useState<{ headers: string[]; rows: string[][] }>(data);
  const [allFilesAnomalies, setAllFilesAnomalies] = useState<Record<string, Anomaly[]>>({});
  const [allFilesTransformedData, setAllFilesTransformedData] = useState<Record<string, { headers: string[]; rows: string[][] }>>({});
  // Add state to track which fixes have been applied
  const [appliedFixes, setAppliedFixes] = useState<Record<string, boolean>>({});
  // Add state for tracking which anomalies are in edit mode
  const [editingFixes, setEditingFixes] = useState<Record<string, boolean>>({});

  // Add collapsed items state
  const [collapsedAnomalies, setCollapsedAnomalies] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && data) {
      // Get available transformations based on data content
      const transformations = dataTransformationService.getAvailableTransformations(data.headers, data.rows);
      setAvailableTransformations(transformations);
      
      // Clear previously selected transformations when modal reopens
      setSelectedTransformations([]);
      setRecommendedTransformations([]);
      
      // Clear applied and editing fixes when modal reopens
      setAppliedFixes({});
      setEditingFixes({});
      
      // Detect anomalies when modal opens
      detectAnomalies();
      
      // Initialize the transformed data for the main file
      const mainFileKey = fileInfo?.fileName || 'main-file';
      setAllFilesTransformedData(prev => ({
        ...prev,
        [mainFileKey]: data
      }));
      
      // Initialize current file data
      setCurrentFileData(data);
      
      // Set the initial selected file
      setSelectedFile(mainFileKey);
    }
  }, [isOpen, data, fileInfo]);

  const detectAnomalies = async () => {
    if (!data || !data.headers || !data.rows || data.rows.length === 0) return;
    
    // Reset applied and editing fixes when re-detecting anomalies
    setAppliedFixes({});
    setEditingFixes({});
    
    setIsDetectingAnomalies(true);
    try {
      // Start with the main file
      const mainFileName = fileInfo?.fileName || 'main-file';
      const mainSheetName = fileInfo?.sheetName || 'default';
      
      // Convert data to CSV format for the anomaly detection service
      const csvContent = [
        data.headers.join(','),
        ...data.rows.map(row => row.join(','))
      ].join('\n');
      
      // Detect anomalies in the main data
      const mainResult = await anomalyDetectionService.detectAnomalies(
        csvContent,
        mainFileName,
        mainSheetName
      );
      
      // Initialize allFilesAnomalies with the main file anomalies
      const newAllFilesAnomalies: Record<string, Anomaly[]> = {
        [mainFileName]: mainResult.anomalies
      };
      
      // Create a map to track collapsed state for all anomalies
      const collapsedMap: Record<string, boolean> = {};
      
      // Set all main file anomalies as collapsed by default
      mainResult.anomalies.forEach((anomaly, index) => {
        const fileName = mainFileName;
        const anomalyKey = anomaly.row && anomaly.column 
          ? `${fileName}-${anomaly.row}-${anomaly.column}` 
          : `anomaly-${index}`;
        collapsedMap[anomalyKey] = true; // Set to collapsed by default
      });
      
      // Update state with the new collapsed map
      setCollapsedAnomalies(collapsedMap);
      
      // Set all anomalies
      setAllFilesAnomalies(newAllFilesAnomalies);
      
      // Set the main file anomalies as current
      setAnomalies(mainResult.anomalies);
      setAnomalyDetectionResult(mainResult);
      
      // Combine all anomalies to get overall recommendations
      const allAnomalies = Object.values(newAllFilesAnomalies).flat();
      
      // Recommend transformations based on all detected anomalies
      const recommended = getRecommendedTransformationsFromAnomalies(allAnomalies);
      setRecommendedTransformations(recommended);
      
      // Pre-select recommended transformations that are safe to apply automatically
      // Only auto-select transformations that don't require manual review of financial data
      const safeTransformations = recommended.filter(id => {
        // These transformations are safe to auto-apply
        const safeTranformationIds = [
          'remove_duplicates', 
          'trim_whitespace', 
          'normalize_text_case',
          'standardize_dates'
        ];
        
        // These transformations may require manual review
        const manualReviewIds = [
          'fill_missing_values',
          'standardize_numbers',
          'remove_empty_rows'
        ];
        
        return safeTranformationIds.includes(id);
      });
      
      setSelectedTransformations(safeTransformations);
      
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    } finally {
      setIsDetectingAnomalies(false);
    }
  };

  const handleTransformationToggle = (transformationId: string) => {
    setSelectedTransformations(prev => 
      prev.includes(transformationId)
        ? prev.filter(id => id !== transformationId)
        : [...prev, transformationId]
    );
  };

  const generateTransformationRules = (): TransformationRule[] => {
    const rules: TransformationRule[] = [];
    // Get all anomalies across all files for context
    const allAnomalies = Object.values(allFilesAnomalies).flat();

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
          // Use a more comprehensive pattern to match financial/numeric columns
          const numericPattern = /amount|price|cost|value|total|sum|number|balance|revenue|profit|margin|income|qty|quantity|count/i;
          
          // Find numeric columns from headers and anomalies
          const numericColumns = new Set<string>();
          
          // Check headers
          data.headers.forEach(header => {
            if (numericPattern.test(header)) {
              numericColumns.add(header);
            }
          });
          
          // Check anomalies
          allAnomalies.forEach(anomaly => {
            if (anomaly.column && numericPattern.test(anomaly.column)) {
              numericColumns.add(anomaly.column);
            }
          });
          
          // Create transformation rules for each numeric column
          Array.from(numericColumns).forEach(header => {
            rules.push({
              id: `standardize_${header}`,
              type: 'convert_type',
              column: header,
              parameters: { targetType: 'number' },
              description: `Standardize number format for ${header}`
            });
          });
          
          // If no specific numeric columns were found, log a warning
          if (numericColumns.size === 0) {
            console.warn('No numeric columns found for standardize_numbers transformation');
          }
          break;

        case 'normalize_text_case':
          // Pattern for text columns that should be normalized
          const textPattern = /name|description|category|type|title|label|status|tag|comment|note/i;
          
          // Find text columns from headers and anomalies
          const textColumns = new Set<string>();
          
          // Check headers
          data.headers.forEach(header => {
            if (textPattern.test(header)) {
              textColumns.add(header);
            }
          });
          
          // Check anomalies
          allAnomalies.forEach(anomaly => {
            if (anomaly.column && 
                textPattern.test(anomaly.column) && 
                !(/date|time|amount|price|cost|value|total|sum|number/i.test(anomaly.column))) {
              textColumns.add(anomaly.column);
            }
          });
          
          // Create transformation rules for each text column
          Array.from(textColumns).forEach(header => {
            rules.push({
              id: `normalize_${header}`,
              type: 'replace',
              column: header,
              parameters: { 
                transform: 'title_case'
              },
              description: `Normalize text case for ${header}`
            });
          });
          
          // If no specific text columns were found, apply to all string columns
          if (textColumns.size === 0) {
            // Apply to any column that doesn't match numeric or date patterns
            const nonTextPattern = /date|time|amount|price|cost|value|total|sum|number|balance|revenue|profit|margin|income|qty|quantity|count/i;
            
            data.headers.forEach(header => {
              if (!nonTextPattern.test(header)) {
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
          }
          break;

        case 'standardize_dates':
          // Identify date columns from both headers and anomalies
          const dateColumns = new Set<string>();
          
          // First, check headers
          data.headers.forEach(header => {
            if (/date|time/i.test(header)) {
              dateColumns.add(header);
            }
          });
          
          // Then, check anomalies to find date-related issues
          anomalies.forEach(anomaly => {
            if (anomaly.column && /date|time/i.test(anomaly.column)) {
              dateColumns.add(anomaly.column);
            }
          });
          
          // Create transformation rules for each date column
          Array.from(dateColumns).forEach(header => {
            rules.push({
              id: `standardize_${header}`,
              type: 'replace',
              column: header,
              parameters: { 
                format: 'YYYY-MM-DD',
                detectFormat: true
              },
              description: `Standardize date format for ${header}`
            });
          });
          break;

        default:
          break;
      }
    });

    return rules;
  };

  const handlePreview = async () => {
    // Save current active tab to restore later if we're not already in preview
    const currentTab = activeTab !== 'preview' ? activeTab : null;
    
    if (selectedTransformations.length === 0) {
      // If no transformations are selected, show the original data
      const mainFileName = fileInfo?.fileName || 'main-file';
      setPreviewData(data);
      setAllFilesTransformedData(prev => ({
        ...prev,
        [mainFileName]: data
      }));
      setActiveTab('preview');
      return;
    }

    setIsApplying(true);
    try {
      console.log("Applying transformations:", selectedTransformations);
      
      // Generate transformation rules based on selected transformations
      const rules = generateTransformationRules();
      console.log("Generated rules:", rules);
      
      if (rules.length === 0) {
        console.warn("No transformation rules were generated from selected transformations");
      }
      
      // Start with the main file
      const mainFileName = fileInfo?.fileName || 'main-file';
      
      // Apply transformations to the main file
      const mainResult = await dataTransformationService.applyTransformations(
        data.headers,
        data.rows,
        rules
      );
      
      if (mainResult.success) {
        console.log("Transformation successful:", mainResult.transformedData);
        
        // Store transformed data for the main file
        const mainTransformedData = mainResult.transformedData;
        
        setAllFilesTransformedData(prev => ({
          ...prev,
          [mainFileName]: mainTransformedData
        }));
        
        // Apply custom anomaly fixes to the main file
        const mainDataWithFixes = applyCustomFixes(mainFileName, mainTransformedData);
        
        // Apply transformations to additional files if they exist
        if (additionalFiles && additionalFiles.length > 0) {
          for (const file of additionalFiles) {
            const fileResult = await dataTransformationService.applyTransformations(
              file.data.headers,
              file.data.rows,
              rules
            );
            
            if (fileResult.success) {
              // Store transformed data for each additional file
              const fileTransformedData = fileResult.transformedData;
              
              setAllFilesTransformedData(prev => ({
                ...prev,
                [file.fileName]: fileTransformedData
              }));
              
              // Apply custom anomaly fixes to this file
              applyCustomFixes(file.fileName, fileTransformedData);
            }
          }
        }
        
        // Set preview data to currently selected file
        const currentFileKey = selectedFile || mainFileName;
        const currentFileData = allFilesTransformedData[currentFileKey] || mainDataWithFixes;
        
        setPreviewData(currentFileData);
        
        // Always switch to preview tab when generating preview
        setActiveTab('preview');
      } else {
        console.error("Transformation failed");
        // Show error message to user
        alert("Failed to apply transformations. Please try again or select different transformations.");
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      // Show error message to user
      alert("An error occurred while applying transformations: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsApplying(false);
    }
  };
  
  // Helper function to apply custom fixes to a specific file
  const applyCustomFixes = (fileName: string, fileData: { headers: string[]; rows: string[][] }) => {
    const updatedData = { ...fileData, rows: [...fileData.rows] };
    
    // Find all custom fixes for this file
    const fileFixKeys = Object.keys(customAnomalyFixes).filter(key => key.startsWith(`${fileName}-`));
    
    for (const key of fileFixKeys) {
      // Extract row and column from the key
      const [, rowStr, column] = key.split('-');
      const row = parseInt(rowStr, 10);
      const columnIndex = updatedData.headers.findIndex(h => h === column);
      
      if (columnIndex !== -1 && row <= updatedData.rows.length) {
        updatedData.rows[row - 1][columnIndex] = customAnomalyFixes[key];
      }
    }
    
    return updatedData;
  };

  const handleApply = async () => {
    if (!previewData) {
      await handlePreview();
      return;
    }

    setIsApplying(true);
    try {
      // Apply transformations to the main file
      const mainFileName = fileInfo?.fileName || 'main-file';
      const mainTransformedData = allFilesTransformedData[mainFileName] || previewData;
      
      // If we have multiple files, we need to combine the results
      if (additionalFiles && additionalFiles.length > 0) {
        const allTransformedFiles = additionalFiles.map(file => {
          const transformedData = allFilesTransformedData[file.fileName] || file.data;
          return {
            fileName: file.fileName,
            sheetName: file.sheetName,
            data: transformedData
          };
        });
        
        // Pass both the main transformed data and all additional transformed files
        onApplyTransformations(mainTransformedData, allTransformedFiles);
      } else {
        // Just pass the main transformed data
        onApplyTransformations(mainTransformedData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error applying transformations:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCustomAnomalyFix = (anomaly: Anomaly, newValue: string) => {
    if (!anomaly.row || !anomaly.column) return;
    
    // Create a unique key for this anomaly that includes the file name
    const fileName = anomaly.file || (fileInfo?.fileName || 'main-file');
    const anomalyKey = `${fileName}-${anomaly.row}-${anomaly.column}`;
    
    // Store the custom fix
    setCustomAnomalyFixes(prev => ({
      ...prev,
      [anomalyKey]: newValue
    }));
    
    // Mark this fix as applied
    setAppliedFixes(prev => ({
      ...prev,
      [anomalyKey]: true
    }));
    
    // Turn off edit mode for this anomaly
    setEditingFixes(prev => ({
      ...prev,
      [anomalyKey]: false
    }));
    
    // Apply the fix to the current file data
    const fileData = allFilesTransformedData[fileName] || currentFileData;
    if (fileData) {
      const updatedRows = [...fileData.rows];
      const columnIndex = fileData.headers.findIndex(h => h === anomaly.column);
      
      if (columnIndex !== -1 && anomaly.row <= updatedRows.length) {
        updatedRows[anomaly.row - 1][columnIndex] = newValue;
        
        // Update transformed data for the specific file
        setAllFilesTransformedData(prev => ({
          ...prev,
          [fileName]: {
            headers: fileData.headers,
            rows: updatedRows
          }
        }));
        
        // If this is the currently selected file, also update current preview
        if (fileName === selectedFile || (!selectedFile && fileName === (fileInfo?.fileName || 'main-file'))) {
          setPreviewData({
            headers: fileData.headers,
            rows: updatedRows
          });
        }
      }
    }
  };

  // Toggle anomaly collapse state
  const toggleAnomalyCollapse = (anomalyKey: string) => {
    setCollapsedAnomalies(prev => ({
      ...prev,
      [anomalyKey]: !prev[anomalyKey]
    }));
  };

  // Toggle edit mode for a specific fix
  const toggleEditFix = (anomalyKey: string) => {
    setEditingFixes(prev => ({
      ...prev,
      [anomalyKey]: !prev[anomalyKey]
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleanup':
        return '';
      case 'format':
        return '';
      case 'calculate':
        return '';
      case 'filter':
        return '';
      default:
        return '';
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

  const getRecommendedTransformationsFromAnomalies = (anomalies: Anomaly[]): string[] => {
    const recommendations = new Set<string>();
    const columnTypeMap: Record<string, { hasDate: boolean; hasNumber: boolean; hasText: boolean }> = {};
    
    // First, analyze columns across all anomalies to determine their data types
    anomalies.forEach(anomaly => {
      if (anomaly.column) {
        if (!columnTypeMap[anomaly.column]) {
          columnTypeMap[anomaly.column] = {
            hasDate: false,
            hasNumber: false,
            hasText: true // Default assumption
          };
        }
        
        // Check column type based on name and anomaly
        if (/date|time/i.test(anomaly.column)) {
          columnTypeMap[anomaly.column].hasDate = true;
        }
        
        if (/amount|price|cost|value|total|sum|number|balance|revenue|profit|margin|income|qty|quantity|count/i.test(anomaly.column)) {
          columnTypeMap[anomaly.column].hasNumber = true;
        }
      }
    });
    
    // Then, determine recommendations based on anomaly types and column types
    anomalies.forEach(anomaly => {
      switch (anomaly.type) {
        case 'duplicate':
          recommendations.add('remove_duplicates');
          break;
          
        case 'missing_data':
          recommendations.add('fill_missing_values');
          recommendations.add('remove_empty_rows');
          break;
          
        case 'inconsistent_format':
          if (anomaly.column && columnTypeMap[anomaly.column]) {
            if (columnTypeMap[anomaly.column].hasDate) {
              recommendations.add('standardize_dates');
            } else if (columnTypeMap[anomaly.column].hasNumber) {
              recommendations.add('standardize_numbers');
            } else {
              recommendations.add('normalize_text_case');
              recommendations.add('trim_whitespace');
            }
          } else {
            // Generic recommendation if no column info
            recommendations.add('trim_whitespace');
          }
          break;
          
        case 'invalid_value':
          if (anomaly.column && columnTypeMap[anomaly.column] && columnTypeMap[anomaly.column].hasNumber) {
            recommendations.add('standardize_numbers');
          } else {
            recommendations.add('trim_whitespace');
          }
          break;
        case 'outlier':
          // For outliers we generally don't recommend automatic transformations
          // as they might be valid business data that needs manual review
          if (!/amount|price|cost|value|total|sum|number|balance|revenue|profit|margin|income/i.test(anomaly.column)) {
            // If it's not a financial field, we can suggest standardization
            recommendations.add('normalize_text_case');
          }
          break;
      }
    });
    
    return Array.from(recommendations);
  };

  const handleFileSelect = (fileName: string | null) => {
    setSelectedFile(fileName);
    
    if (fileName) {
      // Update current anomalies based on selected file
      const fileAnomalies = allFilesAnomalies[fileName] || [];
      setAnomalies(fileAnomalies);
      
      // Update current file data
      if (fileName === (fileInfo?.fileName || 'main-file')) {
        setCurrentFileData(data);
      } else if (additionalFiles) {
        const selectedFileData = additionalFiles.find(f => f.fileName === fileName)?.data;
        if (selectedFileData) {
          setCurrentFileData(selectedFileData);
        }
      }
    } else {
      // If no file is selected, show main file data
      setAnomalies(allFilesAnomalies[fileInfo?.fileName || 'main-file'] || []);
      setCurrentFileData(data);
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
              className={`${styles.tab} ${activeTab === 'anomalies' ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab('anomalies');
                // Refresh anomalies for current file when switching tabs
                if (selectedFile) {
                  const fileAnomalies = allFilesAnomalies[selectedFile] || [];
                  setAnomalies(fileAnomalies);
                }
              }}
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
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Anomalies
              {anomalies.length > 0 && <span className={styles.tabBadge}>{anomalies.length}</span>}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'select' ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab('select');
                // Refresh available transformations based on current data
                if (data && data.headers && data.rows) {
                  const transformations = dataTransformationService.getAvailableTransformations(data.headers, data.rows);
                  setAvailableTransformations(transformations);
                }
              }}
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
              {recommendedTransformations.length > 0 && 
                <span className={styles.tabBadge}>{recommendedTransformations.length}</span>
              }
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
            {activeTab === 'anomalies' ? (
              <div className={styles.anomaliesContainer}>
                {isDetectingAnomalies ? (
                  <div className={styles.loadingContainer}>
                    <span className={styles.spinner}></span>
                    <p>Detecting data anomalies...</p>
                  </div>
                ) : anomalies.length > 0 ? (
                  <>
                    <div className={styles.anomalySummary}>
                      <h3 className={styles.sectionHeading}>Data Quality Issues</h3>
                      <p>{anomalyDetectionResult?.summary || `We found ${anomalies.length} potential issues in your data.`}</p>
                      
                      {recommendedTransformations.length > 0 && (
                        <div className={styles.recommendationsContainer}>
                          <h4 className={styles.sectionHeading}>Recommended Actions</h4>
                          <div className={styles.recommendationsList}>
                            {recommendedTransformations.map(id => {
                              const transformation = availableTransformations.find(t => t.id === id);
                              return transformation ? (
                                <div key={id} className={styles.recommendationItem}>
                                  <input
                                    type="checkbox"
                                    id={`recommend-${id}`}
                                    checked={selectedTransformations.includes(id)}
                                    onChange={() => handleTransformationToggle(id)}
                                  />
                                  <label htmlFor={`recommend-${id}`}>{transformation.name}</label>
                                </div>
                              ) : null;
                            })}
                            <div className={styles.recommendationActionButtons}>
                              <button
                                className={styles.applyRecommendationsButton}
                                onClick={() => {
                                  // Apply the selected transformations directly
                                  if (selectedTransformations.length > 0) {
                                    handlePreview();
                                  }
                                }}
                                disabled={selectedTransformations.length === 0}
                              >
                                Apply Selected Actions
                              </button>
                              <button
                                className={styles.reviewRecommendationsButton}
                                onClick={() => setActiveTab('select')}
                                disabled={selectedTransformations.length === 0}
                              >
                                Review Selected Transformations
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.anomalyList}>
                      <h4 className={styles.sectionHeading}>Detected Issues</h4>
                      
                      {additionalFiles && additionalFiles.length > 0 && (
                        <div className={styles.fileSelector}>
                          <label>Select File:</label>
                          <select 
                            value={selectedFile || (fileInfo?.fileName || 'main-file')} 
                            onChange={(e) => handleFileSelect(e.target.value || null)}
                          >
                            <option value={fileInfo?.fileName || 'main-file'}>
                              {fileInfo?.fileName || 'Current File'} {fileInfo?.sheetName ? `(${fileInfo.sheetName})` : ''}
                            </option>
                            {additionalFiles.map((file, index) => (
                              <option key={index} value={file.fileName}>
                                {file.fileName} {file.sheetName ? `(${file.sheetName})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className={styles.anomalyItems}>
                        {anomalies
                          .filter(anomaly => 
                            !selectedFile || 
                            anomaly.file === selectedFile || 
                            (!anomaly.file && selectedFile === (fileInfo?.fileName || 'main-file'))
                          )
                          .map((anomaly, index) => {
                            // Check if this is a financial column - use a more comprehensive regex to match all financial fields
                            const isFinancialColumn = /amount|price|cost|value|total|sum|balance|payment|revenue|income|profit|margin|stock|dividend|earning|expense|asset|liability|equity|cash|fund|budget|sales|tax|interest|debt|credit|money|financial|currency|dollar|euro|pound|yen|yuan|rupee|commission|invoice|fee/i.test(anomaly.column);
                            
                            // Financial anomalies are either outliers in financial columns or invalid values in financial columns or inconsistent formats in financial columns
                            const isFinancial = (anomaly.type === 'outlier' || anomaly.type === 'invalid_value' || anomaly.type === 'inconsistent_format') && isFinancialColumn;
                            
                            // Make all financial anomalies editable, plus any other anomaly with a specific row and column that could be fixed manually
                            const isEditable = (isFinancial || anomaly.type === 'missing_data') && anomaly.row && anomaly.column;
                            
                            // For debugging - add a console log to check if financial anomalies are being detected
                            if (isFinancial) {
                              console.log('Financial anomaly detected:', anomaly.column, anomaly.type, anomaly.row, anomaly.value);
                            }
                            
                            const fileName = anomaly.file || (fileInfo?.fileName || 'main-file');
                            const anomalyKey = anomaly.row && anomaly.column ? `${fileName}-${anomaly.row}-${anomaly.column}` : `anomaly-${index}`;
                            

                            return (
                              <div 
                                key={anomalyKey} 
                                className={`${styles.anomalyItem} ${styles[`severity${anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}`]}`}
                              >
                                <div 
                                  className={styles.anomalyHeader}
                                  onClick={() => toggleAnomalyCollapse(anomalyKey)}
                                >
                                  <div className={styles.anomalyType}>
                                    <span className={styles.anomalyIcon}>
                                      {anomaly.type === 'outlier' && (
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                        </svg>
                                      )}
                                      {anomaly.type === 'missing_data' && (
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                          <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
                                        </svg>
                                      )}
                                      {anomaly.type === 'inconsistent_format' && (
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                          <polyline points="2 17 12 22 22 17"></polyline>
                                          <polyline points="2 12 12 17 22 12"></polyline>
                                        </svg>
                                      )}
                                      {anomaly.type === 'invalid_value' && (
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                                          <line x1="12" y1="9" x2="12" y2="13"></line>
                                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                      )}
                                      {anomaly.type === 'duplicate' && (
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                                          <path d="M12 11h4"></path>
                                          <path d="M12 16h4"></path>
                                          <path d="M8 11h.01"></path>
                                          <path d="M8 16h.01"></path>
                                        </svg>
                                      )}
                                    </span>
                                    <span className={styles.anomalyTypeText}>
                                      {anomaly.type.replace('_', ' ').charAt(0).toUpperCase() + 
                                       anomaly.type.replace('_', ' ').slice(1)}
                                    </span>
                                    <span className={styles.anomalySeverity}>
                                      {anomaly.severity.toUpperCase()}
                                      {anomaly.severity === 'high' && 
                                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginLeft: '4px' }}>
                                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                      }
                                    </span>
                                    {anomaly.type === 'missing_data' && (
                                      <span className={styles.editableTag}>manually editable</span>
                                    )}
                                  </div>
                                  {anomaly.file && anomaly.file !== (fileInfo?.fileName || 'main-file') && (
                                    <span className={styles.anomalyFile}>
                                      {anomaly.file} {anomaly.sheet && anomaly.sheet !== 'default' ? `(${anomaly.sheet})` : ''}
                                    </span>
                                  )}
                                  <div className={styles.collapseToggle}>
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="16"
                                      height="16"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={collapsedAnomalies[anomalyKey] ? styles.collapsed : ''}
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </div>
                                </div>
                                
                                <div className={`${styles.anomalyDetails} ${collapsedAnomalies[anomalyKey] ? styles.collapsed : ''}`}>
                                  <div className={styles.anomalyLocation}>
                                    <strong>Column:</strong> {anomaly.column}
                                    {anomaly.row && <span><strong>Row:</strong> {anomaly.row}</span>}
                                  </div>
                                  <p className={styles.anomalyDescription}>{anomaly.description}</p>
                                  
                                  {anomaly.value && (
                                    <div className={styles.anomalyValue}>
                                      <strong>Current value:</strong> <span className={styles.valueHighlight}>{anomaly.value}</span>
                                    </div>
                                  )}
                                  
                                  {isEditable && (
                                    <div className={`${styles.anomalyFix} ${isFinancial ? styles.financialFix : ''}`}>
                                      <label htmlFor={`fix-${anomalyKey}`} className={isFinancial ? styles.financialLabel : ''}>
                                        {isFinancial ? 'Fix financial value:' : 'Replace with:'}
                                      </label>
                                      
                                      {appliedFixes[anomalyKey] && !editingFixes[anomalyKey] ? (
                                        <div className={styles.appliedFixContainer}>
                                          <div className={styles.appliedFixValue}>
                                            <span className={styles.appliedStatus}>
                                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="#4CAF50" strokeWidth="2" fill="none">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                              </svg>
                                              Applied:
                                            </span> 
                                            <span className={styles.fixedValue}>{customAnomalyFixes[anomalyKey]}</span>
                                          </div>
                                          <button 
                                            className={styles.editFixButton}
                                            onClick={() => toggleEditFix(anomalyKey)}
                                          >
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            Edit
                                          </button>
                                        </div>
                                      ) : (
                                        <div className={styles.inputGroup}>
                                          <input
                                            id={`fix-${anomalyKey}`}
                                            type="text"
                                            value={customAnomalyFixes[anomalyKey] || anomaly.value || ''}
                                            onChange={(e) => {
                                              // Update the value in state temporarily
                                              setCustomAnomalyFixes(prev => ({
                                                ...prev,
                                                [anomalyKey]: e.target.value
                                              }));
                                            }}
                                            placeholder={isFinancial ? 'Enter corrected financial value' : 'Enter replacement value'}
                                            className={`${styles.fixInput} ${isFinancial ? styles.financialInput : ''}`}
                                          />
                                          <button 
                                            className={styles.applyFixButton}
                                            onClick={() => handleCustomAnomalyFix(anomaly, customAnomalyFixes[anomalyKey] || anomaly.value || '')}
                                          >
                                            Apply Fix
                                          </button>
                                        </div>
                                      )}
                                      
                                      {isFinancial && (
                                        <div className={styles.financialNote}>
                                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                          </svg>
                                          Financial values require manual review and correction
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {anomaly.suggestion && (
                                    <div className={styles.anomalySuggestion}>
                                      <strong>Suggestion:</strong> {anomaly.suggestion}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.noAnomalies}>
                    <div className={styles.iconContainer}>
                      <svg
                        viewBox="0 0 24 24"
                        width="64"
                        height="64"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3>No Significant Anomalies Detected</h3>
                    <p>Your data appears to be clean and ready for analysis.</p>
                    <button 
                      className={styles.scanButton}
                      onClick={detectAnomalies}
                    >
                      Scan Again
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'select' ? (
              <div className={styles.transformationsList}>
                {recommendedTransformations.length > 0 && (
                  <div className={styles.recommendedTransformations}>
                    <h3 className={styles.recommendedTitle}>
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
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"></path>
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                      Recommended Transformations
                      <span className={styles.recommendedCount}>
                        Based on {anomalies.length} detected issues
                      </span>
                    </h3>
                    
                    <div className={styles.recommendedItems}>
                      {recommendedTransformations.map(id => {
                        const transformation = availableTransformations.find(t => t.id === id);
                        if (!transformation) return null;
                        
                        // Determine which anomalies caused this recommendation
                        const relatedAnomalies = anomalies.filter(anomaly => {
                          if (id === 'standardize_dates' && anomaly.column && /date|time/i.test(anomaly.column)) {
                            return true;
                          } else if (id === 'standardize_numbers' && anomaly.column && /amount|price|cost|value|total|sum|number|balance|revenue|profit|margin|income/i.test(anomaly.column)) {
                            return true;
                          } else if (id === 'remove_duplicates' && anomaly.type === 'duplicate') {
                            return true;
                          } else if ((id === 'fill_missing_values' || id === 'remove_empty_rows') && anomaly.type === 'missing_data') {
                            return true;
                          } else if ((id === 'normalize_text_case' || id === 'trim_whitespace') && 
                                    (anomaly.type === 'inconsistent_format' || anomaly.type === 'invalid_value') &&
                                    anomaly.column && !/amount|price|cost|value|total|sum|number|balance|revenue|profit|margin|income|date|time/i.test(anomaly.column)) {
                            return true;
                          }
                          return false;
                        });
                        
                        return (
                          <div key={id} className={styles.recommendedItem}>
                            <label className={styles.transformationLabel}>
                              <input
                                type="checkbox"
                                checked={selectedTransformations.includes(id)}
                                onChange={() => handleTransformationToggle(id)}
                                className={styles.checkbox}
                              />
                              <div className={styles.transformationInfo}>
                                <h4 className={styles.transformationName}>
                                  {transformation.name}
                                  <span className={styles.recommendedBadge}>
                                    Recommended {relatedAnomalies.length > 0 && `(${relatedAnomalies.length} issues)`}
                                  </span>
                                </h4>
                                <p className={styles.transformationDescription}>
                                  {transformation.description}
                                  {relatedAnomalies.length > 0 && relatedAnomalies[0].column && (
                                    <span className={styles.affectedColumns}>
                                      Affects columns: {Array.from(new Set(relatedAnomalies.map(a => a.column))).filter(Boolean).join(', ')}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                                    {recommendedTransformations.includes(transformation.id) && (
                                      <span className={styles.recommendedBadge}>Recommended</span>
                                    )}
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
                      <div className={styles.previewTitleContainer}>
                        <h3 className={styles.previewTitle}>
                          Transformation Preview
                        </h3>
                        <button 
                          className={styles.reloadButton}
                          onClick={handlePreview}
                          title="Reload preview with current transformations"
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
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </button>
                      </div>
                      
                      {additionalFiles && additionalFiles.length > 0 && (
                        <div className={styles.fileSelector}>
                          <label>Previewing File:</label>
                          <select 
                            value={selectedFile || (fileInfo?.fileName || 'main-file')} 
                            onChange={(e) => handleFileSelect(e.target.value || null)}
                          >
                            <option value={fileInfo?.fileName || 'main-file'}>
                              {fileInfo?.fileName || 'Current File'} {fileInfo?.sheetName ? `(${fileInfo.sheetName})` : ''}
                            </option>
                            {additionalFiles.map((file, index) => (
                              <option key={index} value={file.fileName}>
                                {file.fileName} {file.sheetName ? `(${file.sheetName})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                          
                      <div className={styles.previewStats}>
                        <span className={styles.previewStat}>
                          <strong>Rows:</strong> {
                            selectedFile && additionalFiles 
                              ? (additionalFiles.find(f => f.fileName === selectedFile)?.data.rows.length || 0)
                              : data.rows.length
                          } → {previewData.rows.length}
                        </span>
                        <span className={styles.previewStat}>
                          <strong>Columns:</strong> {
                            selectedFile && additionalFiles 
                              ? (additionalFiles.find(f => f.fileName === selectedFile)?.data.headers.length || 0)
                              : data.headers.length
                          } → {previewData.headers.length}
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
                      
                      {Object.keys(allFilesTransformedData).length > 1 && (
                        <div className={styles.multiFileNote}>
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
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Transformations will be applied to all {Object.keys(allFilesTransformedData).length} files when you click "Apply Transformations"
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
            {activeTab === 'anomalies' ? (
              <>
                <button
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={isApplying || isDetectingAnomalies}
                >
                  Cancel
                </button>
                <button
                  className={styles.continueButton}
                  onClick={() => setActiveTab('select')}
                  disabled={isDetectingAnomalies}
                >
                  Continue to Transformations
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginLeft: '8px' }}
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </>
            ) : activeTab === 'select' ? (
              <>
                <button
                  className={styles.backButton}
                  onClick={() => setActiveTab('anomalies')}
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
                  Back to Anomalies
                </button>
                <div className={styles.actionButtonsContainer}>
                  {selectedTransformations.length > 0 && (
                    <div className={styles.selectedCount}>
                      {selectedTransformations.length} transformation{selectedTransformations.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
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
                        Apply & Preview
                      </>
                    )}
                  </button>
                </div>
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
                <div className={styles.actionButtonsContainer}>
                  {selectedTransformations.length > 0 && (
                    <div className={styles.transformationSummary}>
                      {selectedTransformations.length} transformation{selectedTransformations.length !== 1 ? 's' : ''} will be applied
                    </div>
                  )}
                  <button
                    className={styles.applyButton}
                    onClick={handleApply}
                    disabled={!previewData || isApplying}
                  >
                    {isApplying ? (
                      <>
                        <span className={styles.spinner}></span>
                        Applying Transformations...
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
                        Apply Transformations to Data
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
