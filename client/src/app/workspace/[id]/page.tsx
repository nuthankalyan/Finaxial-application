'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './workspace.module.css';
import CsvUploader from '../../components/CsvUploader';
import InsightsPanel from '../../components/InsightsPanel';
import InsightsList, { SavedInsight } from '../../components/InsightsList';
import VisualizationPanel from '../../components/VisualizationPanel';
import VisualizationHistory from '../../components/VisualizationHistory';
import { analyzeCsvWithGemini, generateChartData, analyzeMultipleCsvFiles, generateMultipleFilesChartData, FinancialInsights, ChartData, FileInfo } from '../../services/geminiService';
import { taxOptimizationService, TaxOptimizationResult } from '../../services/taxOptimizationService';
import TaxOptimizationModal from '../../components/TaxOptimizationModal/TaxOptimizationModal';
import { motion, AnimatePresence, color } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendPdfReportByEmail } from '../../services/emailService';
import { Chart as ChartJS, ChartTypeRegistry } from 'chart.js/auto';
import { buildApiUrl } from '../../utils/apiConfig';
import FinancialAssistant, { Message as AssistantMessage } from '../../components/FinancialAssistant';
import StoryMode from '../../components/StoryMode';
import InsightCards, { InsightCardData } from '../../components/InsightCards';
import { logReportGeneration } from '../../services/activityService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DatasetVersion } from '../../types/datasetVersions';
import ThemeToggle from '../../components/ThemeToggle';
import { cleanText, cleanTextArray } from '../../utils/textCleaner';

interface Workspace {
  _id: string;
  name: string;
  description: string;
  owner: string;
  members: string[];
  financialInsights: SavedInsight[];
  createdAt: string;
  updatedAt: string;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, format: 'pdf' | 'word' | 'xml') => void;
  sending: boolean;
}

function EmailModal({ isOpen, onClose, onSubmit, sending }: EmailModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word' | 'xml'>('pdf');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for format dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    onSubmit(email, exportFormat);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <motion.div 
        className={styles.modalContent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <h3>Send Report via Email</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Recipient Email:</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={sending}
            />
            {error && <p className={styles.formError}>{error}</p>}
          </div>

          <div className={styles.formGroup}>
            <label>Export Format:</label>
            <div className={styles.formatSelector} ref={formatDropdownRef}>
              <button
                type="button"
                className={styles.formatButton}
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                disabled={sending}
              >
                <span className={styles.formatButtonText}>
                  {exportFormat === 'pdf' && (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      PDF Format
                    </>
                  )}
                  {exportFormat === 'word' && (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="16" y1="9" x2="8" y2="9"></line>
                      </svg>
                      Word Document
                    </>
                  )}
                  {exportFormat === 'xml' && (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
                        <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
                      </svg>
                      XML Format
                    </>
                  )}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`${styles.formatDropdownArrow} ${showFormatDropdown ? styles.formatDropdownArrowOpen : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showFormatDropdown && (
                <div className={styles.formatDropdownMenu}>
                  <button
                    type="button"
                    className={`${styles.formatDropdownItem} ${exportFormat === 'pdf' ? styles.formatDropdownItemActive : ''}`}
                    onClick={() => {
                      setExportFormat('pdf');
                      setShowFormatDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    PDF Format
                    <span className={styles.formatDescription}>Professional PDF with styling</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`${styles.formatDropdownItem} ${exportFormat === 'word' ? styles.formatDropdownItemActive : ''}`}
                    onClick={() => {
                      setExportFormat('word');
                      setShowFormatDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <line x1="16" y1="9" x2="8" y2="9"></line>
                    </svg>
                    Word Document
                    <span className={styles.formatDescription}>Editable .docx format</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`${styles.formatDropdownItem} ${exportFormat === 'xml' ? styles.formatDropdownItemActive : ''}`}
                    onClick={() => {
                      setExportFormat('xml');
                      setShowFormatDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
                      <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
                    </svg>
                    XML Format
                    <span className={styles.formatDescription}>Structured data format</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.modalButtons}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={sending}
            >
              {sending ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Add Notification component
interface NotificationProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

function Notification({ type, title, message, onClose }: NotificationProps) {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <motion.div 
      className={`${styles.notification} ${type === 'success' ? styles.notificationSuccess : styles.notificationError}`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <div className={styles.notificationIcon}>
        {type === 'success' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className={styles.notificationContent}>
        <p className={styles.notificationTitle}>{title}</p>
        <p className={styles.notificationMessage}>{message}</p>
      </div>
      <button className={styles.notificationClose} onClick={onClose}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </motion.div>
  );
}

// Add this helper function before the WorkspacePage component
function getNumericalInsightsFromData(insights: FinancialInsights): InsightCardData[] {
  if (!insights.numericalInsights || !insights.numericalInsights.metrics || insights.numericalInsights.metrics.length === 0) {
    // If no metrics are available, return default cards
    return [
      {
        value: '12',
        label: 'Publications',
        change: { value: 100, positive: true }
      },
      {
        value: '533', 
        label: 'Publications Viewed',
        change: { value: 8.8, positive: true }
      },
      {
        value: '112',
        label: 'Hours spent on reviewing',
        change: { value: 8.8, positive: true }
      },
      {
        value: '5',
        label: 'Number of Tests',
        change: { value: 8.8, positive: true }
      },
      {
        value: '100',
        label: 'Number of Tests Taken',
        change: { value: 12.3, positive: false }
      },
      {
        value: '89%',
        label: 'Tests Completion Rate',
        change: { value: 8.8, positive: true }
      }
    ];
  }
  
  // Map the metrics to the format required by InsightCards
  return insights.numericalInsights.metrics.map(metric => ({
    value: metric.value,
    label: metric.label,
    change: metric.change
  }));
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [savedInsightCards, setSavedInsightCards] = useState<InsightCardData[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [exporting, setExporting] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  
  // Add new state for visualizations
  const [charts, setCharts] = useState<ChartData[] | null>(null);
  const [generatingCharts, setGeneratingCharts] = useState(false);
  
  // Add new state for email functionality
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showModalExportDropdown, setShowModalExportDropdown] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Add a ref for scroll-into-view functionality
  const contentRef = useRef<HTMLDivElement>(null);

  // Add new state for notification
  const [notification, setNotification] = useState<{ 
    show: boolean; 
    type: 'success' | 'error'; 
    title: string; 
    message: string 
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Add new state to track selected insight for details modal
  const [selectedInsight, setSelectedInsight] = useState<SavedInsight | null>(null);
  const [showInsightDetails, setShowInsightDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'insights' | 'visualizations' | 'assistantChat' | 'notes'>('insights');

  // Add new state for data validation popup
  const [showDataValidationError, setShowDataValidationError] = useState(false);

  // Add new state for assistant chat
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([{
    id: '1',
    text: 'Hello! I\'m your financial assistant. Ask me anything about your uploaded financial data.',
    sender: 'assistant',
    timestamp: new Date()
  }]);

  // Add new state for notes
  const [notes, setNotes] = useState<string>('');

  // Add new state for version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [datasetVersions, setDatasetVersions] = useState<DatasetVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  
  // Add new state for tax optimization
  const [taxOptimizationResult, setTaxOptimizationResult] = useState<TaxOptimizationResult | null>(null);
  const [showTaxOptimizationModal, setShowTaxOptimizationModal] = useState(false);
  const [generatingTaxOptimization, setGeneratingTaxOptimization] = useState(false);
  
  // Effect to handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close main export dropdown if clicking outside
      if (showExportDropdown && !target.closest(`.${styles.exportDropdown}`)) {
        setShowExportDropdown(false);
      }
      
      // Close modal export dropdown if clicking outside
      if (showModalExportDropdown && !target.closest(`.${styles.modalExportDropdown}`)) {
        setShowModalExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showModalExportDropdown]);
  
  
  // Effect to restore insights and other data from session storage when component mounts
  useEffect(() => {
    try {
      // Only restore data if we don't already have insights loaded
      if (!insights) {
        // Restore insights
        const savedInsightsData = sessionStorage.getItem(`workspace_${id}_insights`);
        if (savedInsightsData) {
          const parsedInsights = JSON.parse(savedInsightsData) as FinancialInsights;
          setInsights(parsedInsights);
        }
        
        // Restore charts
        const savedChartsData = sessionStorage.getItem(`workspace_${id}_charts`);
        if (savedChartsData) {
          const parsedCharts = JSON.parse(savedChartsData) as ChartData[];
          setCharts(parsedCharts);
        }
        
        // Restore fileName
        const savedFileName = sessionStorage.getItem(`workspace_${id}_fileName`);
        if (savedFileName) {
          setFileName(savedFileName);
        }
        
        // Restore csvContent
        const savedCsvContent = sessionStorage.getItem(`workspace_${id}_csvContent`);
        if (savedCsvContent) {
          setCsvContent(savedCsvContent);
        }
        
        // Restore uploadedFiles
        const savedUploadedFiles = sessionStorage.getItem(`workspace_${id}_uploadedFiles`);
        if (savedUploadedFiles) {
          const parsedFiles = JSON.parse(savedUploadedFiles) as FileInfo[];
          setUploadedFiles(parsedFiles);
        }
      }
      
      // Always restore notes from localStorage (regardless of insights state)
      const savedNotes = localStorage.getItem(`notes_${id}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    } catch (error) {
      console.error('Error restoring data from session storage:', error);
    }
  }, [id, insights]);
  
  // Simple helper function to format chat messages for display
  const formatChatMessage = (text: string): React.ReactNode => {
    // Check for code blocks
    if (text.includes('```')) {
      // Split text by code blocks
      const parts = text.split(/```([\s\S]*?)```/);
      return (
        <>
          {parts.map((part, index) => {
            // Even indices are regular text, odd indices are code blocks
            if (index % 2 === 0) {
              return part ? <p key={index} className={styles.messageParagraph}>{part}</p> : null;
            } else {
              return (
                <pre key={index} className={styles.codeBlock}>
                  <code>{part}</code>
                </pre>
              );
            }
          })}
        </>
      );
    }
    
    // Check for SQL queries
    if (text.toLowerCase().includes('select') && text.toLowerCase().includes('from')) {
      const lines = text.split('\n');
      // Find SQL-like lines
      const formattedLines = lines.map((line, index) => {
        if (line.toLowerCase().includes('select') || line.toLowerCase().includes('from') || 
            line.toLowerCase().includes('where') || line.toLowerCase().includes('group by') ||
            line.toLowerCase().includes('order by')) {
          return <div key={index} className={styles.sqlLine}>{line}</div>;
        }
        return <div key={index}>{line}</div>;
      });
      
      return <div className={styles.formattedText}>{formattedLines}</div>;
    }
    
    // Format lists
    if (text.includes('\n- ') || text.includes('\n* ')) {
      const lines = text.split('\n');
      const formattedLines = lines.map((line, index) => {
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={index}>{line.substring(2)}</li>;
        }
        return line ? <p key={index}>{line}</p> : null;
      });
      
      return <div className={styles.formattedText}>{formattedLines}</div>;
    }
    
    // Default formatting with proper line breaks
    return <div className={styles.formattedText}>{text}</div>;
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch workspace data
    const fetchWorkspace = async () => {
      try {
        const response = await fetch(buildApiUrl(`api/workspaces/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch workspace');
        }

        const data = await response.json();
        setWorkspace(data.data);
        
        // If the workspace has saved insights, set them
        if (data.data.financialInsights && data.data.financialInsights.length > 0) {
          setSavedInsights(data.data.financialInsights);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [id, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Add a function to check if data is financial in nature
  const isFinancialData = (csvContent: string): boolean => {
    // Convert to lowercase for case-insensitive matching
    const lowerCaseContent = csvContent.toLowerCase();
    
    // Define financial keywords and patterns to look for
    const financialKeywords = [
      'revenue', 'profit', 'loss', 'balance', 'asset', 'liability', 
      'income', 'expense', 'cash flow', 'dividend', 'investment',
      'equity', 'debt', 'tax', 'interest', 'capital', 'budget',
      'fiscal', 'quarter', 'annual', 'statement', 'sales', 'cost',
      'price', 'share', 'stock', 'financial', 'accounting', 'roi',
      'margin', 'ebitda', 'depreciation', 'amortization', 'payment'
    ];
    
    // Check for common financial column headers
    const financialColumnPatterns = [
      /\b(q[1-4]|quarter[1-4])\b/,  // Quarterly data
      /\bfy\d{2,4}\b/,              // Fiscal year
      /\b\d{4}\b/,                  // Years
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/, // Months
      /\bvalue\b/,
      /\bamount\b/,
      /\brate\b/,
      /\btotal\b/,
    ];
    
    // Check if any financial keywords are found
    const hasFinancialKeywords = financialKeywords.some(keyword => 
      lowerCaseContent.includes(keyword)
    );
    
    // Check if any financial column patterns are found
    const hasFinancialColumns = financialColumnPatterns.some(pattern => 
      pattern.test(lowerCaseContent)
    );
    
    // Check if there are numeric values in the data (percentage of numeric content)
    const numericContent = lowerCaseContent.replace(/[^\d.-]/g, '').length;
    const totalContent = lowerCaseContent.length;
    const numericRatio = totalContent > 0 ? numericContent / totalContent : 0;
    
    // Data is considered financial if it has financial keywords or column patterns
    // and also has a reasonable amount of numeric content
    return (hasFinancialKeywords || hasFinancialColumns) && numericRatio > 0.1;
  };  const handleFileUpload = async (filesContent: { content: string; fileName: string }[]) => {
    if (filesContent.length === 0) return;
    
    // Set the filename to display - if multiple files, use a descriptive label
    if (filesContent.length === 1) {
      setFileName(filesContent[0].fileName);
      setCsvContent(filesContent[0].content);
      
      // Store in session storage
      sessionStorage.setItem(`workspace_${id}_fileName`, filesContent[0].fileName);
      sessionStorage.setItem(`workspace_${id}_csvContent`, filesContent[0].content);
    } else {
      const multipleFilesLabel = `${filesContent.length} files selected`;
      setFileName(multipleFilesLabel);
      // Store the first file's content for any functions that still require a single CSV
      setCsvContent(filesContent[0].content);
      
      // Store in session storage
      sessionStorage.setItem(`workspace_${id}_fileName`, multipleFilesLabel);
      sessionStorage.setItem(`workspace_${id}_csvContent`, filesContent[0].content);
    }
    
    // Check if at least the primary file has financial data
    if (!isFinancialData(filesContent[0].content)) {
      // Show notification for non-financial data
      setNotification({
        show: true,
        type: 'error',
        title: 'Non-Financial Data Detected',
        message: 'The uploaded file does not appear to contain financial data. Please upload data related to financial analysis.'
      });
      setShowDataValidationError(true);
      return;
    }
    
    setAnalyzing(true);
    setInsights(null);
    setCharts(null);
    setIsViewingHistory(false);
    
    // Clear notes when new data is uploaded
    setNotes('');
    localStorage.removeItem(`notes_${id}`);
    
    // Reset assistant messages when new files are uploaded
    setAssistantMessages([{
      id: '1',
      text: `Hello! I'm your financial assistant. You've uploaded ${filesContent.length} ${filesContent.length === 1 ? 'file' : 'files'}. Ask me anything about your financial data.`,
      sender: 'assistant',
      timestamp: new Date()
    }]);
    
    try {      // Convert the files to FileInfo format for the Gemini service
      const files: FileInfo[] = filesContent.map(file => ({
        content: file.content,
        fileName: file.fileName
      }));
      
      // Store the files for access by other components
      setUploadedFiles(files);
      
      // Store uploaded files in session storage
      sessionStorage.setItem(`workspace_${id}_uploadedFiles`, JSON.stringify(files));

      // Use multi-file analysis when multiple files are uploaded
      let results: FinancialInsights;
      
      if (files.length > 1) {
        // Use the multi-file analysis function
        results = await analyzeMultipleCsvFiles(files);
        console.log("Analyzed multiple files:", files.map(f => f.fileName).join(", "));
      } else {
        // Use the single file function for better optimization with one file
        results = await analyzeCsvWithGemini(files[0].content);
        results.fileNames = [files[0].fileName];
      }
      
      setInsights(results);
      
      // Store insights in session storage for persistence across navigation
      sessionStorage.setItem(`workspace_${id}_insights`, JSON.stringify(results));
      
      // Generate chart data
      setGeneratingCharts(true);
      try {
        // Use multi-file chart generation when multiple files are uploaded
        const chartData = files.length > 1 
          ? await generateMultipleFilesChartData(files)
          : await generateChartData(files[0].content);
        
        // Check if we received fallback charts (which would mean there was an error)
        const isFallbackChart = chartData.length === 1 && 
                               chartData[0].title === 'Financial Data Overview' &&
                               chartData[0].description.startsWith('Unable to generate') || 
                               chartData[0].description.startsWith('Error:');
                               
        if (isFallbackChart) {
          console.warn('Using fallback charts due to chart generation issues');
          // We still set the charts, but also show a subtle notification
          setCharts(chartData);
          setNotification({
            show: true,
            type: 'error',
            title: 'Chart Generation Limited',
            message: 'There were some issues creating detailed visualizations. Basic charts are displayed instead.'
          });
        } else {
          // We got proper charts, use them
          setCharts(chartData);
          
          // Store charts in session storage for persistence across navigation
          sessionStorage.setItem(`workspace_${id}_charts`, JSON.stringify(chartData));
        }
      } catch (chartError) {
        console.error('Error generating chart data:', chartError);
        // Don't show an error notification here, the generateChartData function
        // now returns fallback charts instead of throwing
        setCharts(null);
      } finally {
        setGeneratingCharts(false);
      }
      
      // Scroll to the content area when insights load
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      setError(err.message);
      setNotification({
        show: true,
        type: 'error',
        title: 'Analysis Failed',
        message: err.message || 'Failed to analyze CSV data'
      });
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleAssistantMessagesChange = (messages: AssistantMessage[]) => {
    setAssistantMessages(messages);
  };

  const saveInsightsToDatabase = async () => {
    if (!insights || !fileName) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    setSaving(true);
    
    try {
      // Convert arrays to strings for the server
      const insightsString = Array.isArray(insights.insights) 
        ? insights.insights.join('\n\n') 
        : insights.insights;
        
      const recommendationsString = Array.isArray(insights.recommendations) 
        ? insights.recommendations.join('\n\n') 
        : insights.recommendations;
      
      // Convert assistant messages to a format suitable for storing
      const assistantChatHistory = assistantMessages.length > 0 
        ? assistantMessages.map(msg => ({
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.timestamp.toISOString()
          }))
        : [];
      
      // Get the numerical insight cards
      const insightCards = getNumericalInsightsFromData(insights);
      
      const response = await fetch(buildApiUrl(`api/workspaces/${id}/insights`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName,
          summary: insights.summary,
          insights: insightsString,
          recommendations: recommendationsString,
          charts: charts,  // Save the chart data
          assistantChat: assistantChatHistory, // Add the assistant chat history
          insightCards: insightCards, // Save the insight cards
          notes: notes, // Save the notes
          rawResponse: insights.rawResponse
        }),
      });
      
      console.log('Saving insights with notes:', notes); // Debug log
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save insights');
      }
      
      const data = await response.json();
      
      // Convert the returned insights and recommendations back to arrays for local state
      const savedInsight = {
        ...data.data,
        insights: Array.isArray(data.data.insights) 
          ? data.data.insights 
          : data.data.insights.split('\n\n').filter(Boolean),
        recommendations: Array.isArray(data.data.recommendations) 
          ? data.data.recommendations 
          : data.data.recommendations.split('\n\n').filter(Boolean),
        charts: data.data.charts || null,
        insightCards: data.data.insightCards || null, // Include insightCards in the saved insight
        assistantChat: data.data.assistantChat || [], // Make sure assistantChat is included
        notes: data.data.notes || '' // Include notes in the saved insight
      };
      
      // Add the newly saved insight to the savedInsights state
      setSavedInsights(prevInsights => [savedInsight, ...prevInsights]);
      
      // Save notes to localStorage as well
      localStorage.setItem(`notes_${id}`, notes);
      
      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        title: 'Insights Saved',
        message: 'Your financial analysis and notes have been saved successfully.'
      });
      
      // Clear the current insights after saving
      setInsights(null);
      setFileName(null);
      setCharts(null);
      setNotes(''); // Clear notes as well
      
      // Don't reset assistant messages here - keep the conversation going
      // This allows users to continue their conversation with the assistant after saving
    } catch (err: any) {
      setError(`Failed to save insights: ${err.message}`);
      setNotification({
        show: true,
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save insights'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewInsight = (insight: SavedInsight) => {
    setIsViewingHistory(true);
    
    // Ensure insights and recommendations are arrays
    const insightsArray = Array.isArray(insight.insights) 
      ? insight.insights 
      : typeof insight.insights === 'string'
        ? insight.insights.split('\n\n').filter(Boolean)
        : [];
        
    const recommendationsArray = Array.isArray(insight.recommendations) 
      ? insight.recommendations 
      : typeof insight.recommendations === 'string'
        ? insight.recommendations.split('\n\n').filter(Boolean)
        : [];
    
    setInsights({
      summary: insight.summary,
      insights: insightsArray,
      recommendations: recommendationsArray,
      rawResponse: insight.rawResponse
    });
    
    // Set saved insight cards if available
    if (insight.insightCards && Array.isArray(insight.insightCards)) {
      setSavedInsightCards(insight.insightCards);
    } else {
      setSavedInsightCards(null);
    }
    
    // Restore notes if available
    if (insight.notes) {
      setNotes(insight.notes);
    } else {
      setNotes('');
    }
    
    setFileName(insight.fileName);
    setActiveTab('summary');
    
    // Set the charts data if available
    if (insight.charts && Array.isArray(insight.charts)) {
      setCharts(insight.charts);
    } else {
      setCharts(null);
    }

    // Restore assistant chat messages if available
    if (insight.assistantChat && Array.isArray(insight.assistantChat)) {
      // Convert stored chat data back to Message objects with proper Date objects
      const restoredMessages = insight.assistantChat.map(msg => ({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2), // Generate new IDs
        text: msg.text,
        sender: msg.sender as 'user' | 'assistant',
        timestamp: new Date(msg.timestamp)
      }));
      
      // If we have messages, set them, otherwise initialize with default welcome message
      if (restoredMessages.length > 0) {
        setAssistantMessages(restoredMessages);
      } else {
        setAssistantMessages([{
          id: '1',
          text: 'Hello! I\'m your financial assistant. Ask me anything about your uploaded financial data.',
          sender: 'assistant',
          timestamp: new Date()
        }]);
      }
    } else {
      // Reset to default if no chat history
      setAssistantMessages([{
        id: '1',
        text: 'Hello! I\'m your financial assistant. Ask me anything about your uploaded financial data.',
        sender: 'assistant',
        timestamp: new Date()
      }]);
    }
    
    // Scroll to the content area when viewing saved insights
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add a new function to open the insight details modal
  const openInsightDetails = (insight: SavedInsight) => {
    console.log('Opening insight details with notes:', insight.notes); // Debug log
    setSelectedInsight(insight);
    setShowInsightDetails(true);
    // Default to insights tab, but switch to visualizations if there are no insights
    setDetailsTab('insights');
    // Set saved insight cards if available
    if (insight.insightCards && Array.isArray(insight.insightCards)) {
      setSavedInsightCards(insight.insightCards);
    } else {
      setSavedInsightCards(null);
    }
    
    // Restore notes if available
    if (insight.notes) {
      setNotes(insight.notes);
    } else {
      setNotes('');
    }
  };

  // Generate PDF function (will be reused for email)
  const generatePdf = async (): Promise<jsPDF | null> => {
    if (!insights || !fileName) return null;
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: `Financial Insights - ${fileName}`,
        subject: 'Financial Analysis Report',
        author: 'Finaxial App',
        creator: 'Finaxial App'
      });
      
      // Define PDF layout constants
      const footerPosition = 280;
      const footerMargin = 15; // Margin above footer to prevent content overflow
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(33, 37, 41);
      doc.text(`Financial Insights Report`, 15, 20);
      
      // Add file info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`File: ${fileName}`, 15, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 36);
      
      // Add divider
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 40, 195, 40);
      
      // Variables for positioning
      let currentY = 50;
      let summaryEndY = 0;
      
      // Get insight cards - use saved ones if available, otherwise generate from insights
      const insightCardsData = savedInsightCards || getNumericalInsightsFromData(insights);
      
      // Add Key Metrics section for insight cards (keep on cover page)
      if (insightCardsData && insightCardsData.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(33, 37, 41);
        doc.text('Key Metrics', 15, currentY);
        const cardsTableData = insightCardsData.map(card => {
          const changeText = card.change ? 
            `${card.change.positive ? '+' : '-'}${Math.abs(card.change.value)}%` : 
            'N/A';
          return [card.label, card.value.toString(), changeText];
        });
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Metric', 'Value', 'Change']],
          body: cardsTableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [79, 70, 229],
            textColor: 255
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          },
          styles: {
            cellPadding: 5,
            fontSize: 10
          },
          margin: { bottom: 10 }
        });
      }

      // --- Start Summary on a new page ---
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text('Summary', 15, 20);
      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      const textLines = doc.splitTextToSize(insights.summary, 170);
      doc.text(textLines, 15, 30);

      // --- Start Key Insights on a new page ---
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text('Key Insights', 15, 20);
      const insightsData = Array.isArray(insights.insights) 
        ? insights.insights.map((insight, index) => [`${index + 1}.`, insight]) 
        : [['', 'No insights available']];
      autoTable(doc, {
        startY: 30,
        head: [['#', 'Insight']],
        body: insightsData,
        theme: 'grid',
        headStyles: { 
          fillColor: [79, 70, 229],
          textColor: 255
        },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'auto'
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 'auto' }
        },
        margin: { bottom: footerMargin + 10 }
      });

      // --- Start Recommendations on a new page ---
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text('Recommendations', 15, 20);
      const recommendationsData = Array.isArray(insights.recommendations) 
        ? insights.recommendations.map((recommendation, index) => [`${index + 1}.`, recommendation]) 
        : [['', 'No recommendations available']];
      autoTable(doc, {
        startY: 30,
        head: [['#', 'Recommendation']],
        body: recommendationsData,
        theme: 'grid',
        headStyles: { 
          fillColor: [79, 70, 229],
          textColor: 255
        },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'auto'
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 'auto' }
        },
        margin: { bottom: footerMargin + 10 }
      });

      // --- Start Visualizations on a new page ---
      if (charts && charts.length > 0) {
        charts.forEach((chart, index) => {
          doc.addPage();
          doc.setFontSize(16);
          doc.setTextColor(33, 37, 41);
          doc.text('Visualizations', 15, 20);
          let currentY = 30;
          const chartWidth = 180;
          const chartHeight = 100;
          
          // Use a heavier font weight for chart title
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold"); // Set font to bold
          doc.setTextColor(33, 37, 41);
          doc.text(chart.title, 15, currentY);
          doc.setFont("helvetica", "normal"); // Reset font weight
          currentY += 8;
          
          try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = chartWidth * 5;
        tempCanvas.height = chartHeight * 5;
        tempCanvas.style.width = `${chartWidth}px`;
        tempCanvas.style.height = `${chartHeight}px`;
        document.body.appendChild(tempCanvas);
        const chartInstance = new ChartJS(tempCanvas, {
          type: chart.type as keyof ChartTypeRegistry,
          data: chart.data,
          options: {
            ...chart.options,
            responsive: false,
            animation: false,
            plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: {
            weight: 'bold', // Make legend labels bold
            size: 11 // Slightly increase font size
              }
            }
          },
          title: {
            display: false
          }
            },
            scales: {
          ...(chart.options?.scales || {}),
          x: {
            ...(chart.options?.scales?.x || {}),
            ticks: {
              ...(chart.options?.scales?.x?.ticks || {}),
              font: {
            weight: 'bold', // Make x-axis labels bold
            size: 10
              }
            },
            title: {
              ...(chart.options?.scales?.x?.title || {}),
              font: {
            weight: 'bold', // Make x-axis title bold
            size: 11
              }
            }
          },
          y: {
            ...(chart.options?.scales?.y || {}),
            ticks: {
              ...(chart.options?.scales?.y?.ticks || {}),
              font: {
            weight: 'bold', // Make y-axis labels bold
            size: 10
              }
            },
            title: {
              ...(chart.options?.scales?.y?.title || {}),
              font: {
            weight: 'bold', // Make y-axis title bold
            size: 11
              }
            }
          }
            }
          }
        });
        chartInstance.render();
        const imageData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imageData, 'PNG', 15, currentY, chartWidth, chartHeight);
        chartInstance.destroy();
        document.body.removeChild(tempCanvas);
        currentY += chartHeight + 10;
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        const descriptionLines = doc.splitTextToSize(chart.description, 170);
        doc.text(descriptionLines, 15, currentY);
          } catch (chartError) {
        console.error('Error rendering chart in PDF:', chartError);
        doc.setFontSize(10);
        doc.setTextColor(220, 53, 69);
        doc.text(`Could not render chart: ${chart.title}`, 15, currentY);
          }
        });
      }
      
      // Add footer with app name
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Add footer line to visually separate content from footer
        doc.setDrawColor(200, 200, 200);
        doc.line(15, footerPosition - footerMargin, 195, footerPosition - footerMargin);
        
        // Add footer text
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Finaxial App - Financial Insights Report', 15, footerPosition);
        doc.text(`Page ${i} of ${pageCount}`, 180, footerPosition);
      }
      
      // Log the report generation activity
      try {
        await logReportGeneration(params.id, selectedInsight?._id || 'workspace-summary', 'pdf');
      } catch (error) {
        console.error('Failed to log report generation:', error);
        // Continue with PDF generation even if logging fails
      }
      
      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  // Export PDF handler
  const exportToPdf = async () => {
    setExporting(true);
    
    try {
      const doc = await generatePdf();
      
      if (doc && fileName) {
        // Save the PDF
        doc.save(`${fileName.replace(/\.[^/.]+$/, '')}-report.pdf`);
        
        // Show success message
        toast.success('PDF exported successfully');
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  // Export to Word function
  const exportToWord = async () => {
    setExporting(true);
    
    try {
      if (!insights || !fileName) {
        toast.error('No data available to export');
        return;
      }

      // Create Word document content as HTML
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Financial Assistant Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .header-info { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
            .insight-item { margin-bottom: 15px; padding: 10px; background-color: #f9fafb; border-left: 4px solid #4f46e5; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            .metrics-table { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Financial Assistant Analysis Report</h1>
          <div class="header-info">
            <p><strong>File:</strong> ${fileName}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
      `;

      // Add Key Metrics if available
      const insightCardsData = savedInsightCards || getNumericalInsightsFromData(insights);
      if (insightCardsData && insightCardsData.length > 0) {
        htmlContent += `
          <h2>Key Metrics</h2>
          <table class="metrics-table">
            <tr><th>Metric</th><th>Value</th><th>Change</th></tr>
        `;
        
        insightCardsData.forEach(card => {
          const changeText = card.change ? 
            `${card.change.positive ? '+' : '-'}${Math.abs(card.change.value)}%` : 
            'N/A';
          htmlContent += `<tr><td>${card.label}</td><td>${card.value}</td><td>${changeText}</td></tr>`;
        });
        
        htmlContent += `</table>`;
      }

      // Add Summary
      htmlContent += `
        <h2>Summary</h2>
        <p>${insights.summary}</p>
      `;

      // Add Key Insights
      if (Array.isArray(insights.insights) && insights.insights.length > 0) {
        htmlContent += `<h2>Key Insights</h2>`;
        insights.insights.forEach((insight, index) => {
          htmlContent += `<div class="insight-item">${index + 1}. ${insight}</div>`;
        });
      }

      htmlContent += `
        </body>
        </html>
      `;

      // Create and download the Word document
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}-report.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Word document exported successfully');
    } catch (error) {
      console.error('Error exporting Word document:', error);
      toast.error('Failed to export Word document');
    } finally {
      setExporting(false);
    }
  };

  // Export to XML function
  const exportToXML = async () => {
    setExporting(true);
    
    try {
      if (!insights || !fileName) {
        toast.error('No data available to export');
        return;
      }

      // Create XML content
      let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinancialReport>
  <Header>
    <Title>Financial Assistant Analysis Report</Title>
    <FileName>${fileName}</FileName>
    <GeneratedDate>${new Date().toISOString()}</GeneratedDate>
  </Header>
      `;

      // Add Key Metrics if available
      const insightCardsData = savedInsightCards || getNumericalInsightsFromData(insights);
      if (insightCardsData && insightCardsData.length > 0) {
        xmlContent += `
  <KeyMetrics>`;
        
        insightCardsData.forEach(card => {
          const changeValue = card.change ? card.change.value : 0;
          const changeDirection = card.change ? (card.change.positive ? 'positive' : 'negative') : 'none';
          xmlContent += `
    <Metric>
      <Label>${card.label}</Label>
      <Value>${card.value}</Value>
      <Change direction="${changeDirection}">${changeValue}</Change>
    </Metric>`;
        });
        
        xmlContent += `
  </KeyMetrics>`;
      }

      // Add Summary
      xmlContent += `
  <Summary><![CDATA[${insights.summary}]]></Summary>
      `;

      // Add Key Insights
      if (Array.isArray(insights.insights) && insights.insights.length > 0) {
        xmlContent += `
  <KeyInsights>`;
        insights.insights.forEach((insight, index) => {
          xmlContent += `
    <Insight id="${index + 1}"><![CDATA[${insight}]]></Insight>`;
        });
        xmlContent += `
  </KeyInsights>`;
      }

      xmlContent += `
</FinancialReport>`;

      // Create and download the XML file
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}-report.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('XML file exported successfully');
    } catch (error) {
      console.error('Error exporting XML file:', error);
      toast.error('Failed to export XML file');
    } finally {
      setExporting(false);
    }
  };
  
  const sendEmailWithPdf = async (recipientEmail: string) => {
    if (!insights || !fileName) return;
    
    setSending(true);
    
    try {
      const doc = await generatePdf();
      if (!doc) {
        throw new Error('Failed to generate PDF');
      }
      
      // Generate a unique filename
      const uniqueFileName = `financial-insights-${fileName.replace(/\.[^/.]+$/, '')}-${Date.now()}.pdf`;
      
      // Convert PDF to base64 string - use datauristring which is supported by jsPDF
      const pdfData = doc.output('datauristring');
      // Extract the base64 data from the data URI
      const base64Data = pdfData.split(',')[1];
      
      if (!base64Data) {
        throw new Error('Failed to generate PDF data');
      }
      
      // Create email subject and message
      const subject = `Financial Insights Report - ${fileName}`;
      const message = `Please find attached the financial insights report for ${fileName}.`;
      
      console.log('Sending email with the PDF report...');
      console.log(`PDF data size: ${base64Data.length} characters`);
      
      // Send the email using our node.js API with nodemailer
      const result = await sendPdfReportByEmail(
        recipientEmail,
        base64Data,
        uniqueFileName,
        subject,
        message
      );
      
      if (result.success) {
        console.log('Email sent successfully:', result.message);
        setEmailSent(true);
        
        // Close the modal after sending
        setShowEmailModal(false);
        
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'Email Sent',
          message: `Report successfully sent to ${recipientEmail}`
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(`Failed to send email: ${err.message}`);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Email Failed',
        message: err.message || 'Failed to send email'
      });
    } finally {
      setSending(false);
    }
  };

  // Function to close notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Function to handle email submission with format selection
  const handleEmailSubmit = async (email: string, format: 'pdf' | 'word' | 'xml') => {
    if (!insights || !fileName) {
      setNotification({
        show: true,
        type: 'error',
        title: 'No Data Available',
        message: 'Please upload and analyze financial data first before sending email.'
      });
      return;
    }

    setSending(true);
    
    try {
      let fileData: string;
      let fileName_final: string;
      let contentType: string;
      
      const baseFileName = `financial-insights-${fileName.replace(/\.[^/.]+$/, '')}-${Date.now()}`;
      
      // Generate data based on selected format
      switch (format) {
        case 'pdf':
          // Generate PDF as base64
          const doc = await generatePdf();
          if (!doc) {
            throw new Error('Failed to generate PDF for email');
          }
          const pdfData = doc.output('datauristring');
          const base64Data = pdfData.split(',')[1];
          if (!base64Data) {
            throw new Error('Failed to generate PDF data');
          }
          fileData = base64Data;
          fileName_final = `${baseFileName}.pdf`;
          contentType = 'application/pdf';
          break;
          
        case 'word':
          // Generate Word document HTML content
          let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Financial Assistant Analysis Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 30px; }
                .header-info { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
                .insight-item { margin-bottom: 15px; padding: 10px; background-color: #f9fafb; border-left: 4px solid #4f46e5; }
              </style>
            </head>
            <body>
              <h1>Financial Assistant Analysis Report</h1>
              <div class="header-info">
                <p><strong>File:</strong> ${fileName}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <h2>Key Insights</h2>
          `;
          
          insights.insights.forEach(insight => {
            htmlContent += `<div class="insight-item">${insight}</div>`;
          });
          
          htmlContent += `<h2>Recommendations</h2>`;
          insights.recommendations.forEach(recommendation => {
            htmlContent += `<div class="insight-item">${recommendation}</div>`;
          });
          
          htmlContent += `</body></html>`;
          
          // Convert HTML to base64 for email sending
          fileData = btoa(unescape(encodeURIComponent(htmlContent)));
          fileName_final = `${baseFileName}.doc`;
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
          
        case 'xml':
          // Generate XML content
          let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinancialReport>
  <Header>
    <Title>Financial Assistant Analysis Report</Title>
    <FileName>${fileName}</FileName>
    <GeneratedDate>${new Date().toISOString()}</GeneratedDate>
  </Header>
  <Insights>`;
          
          insights.insights.forEach((insight, index) => {
            xmlContent += `
    <Insight id="${index + 1}">
      <Content>${insight}</Content>
    </Insight>`;
          });
          
          xmlContent += `
  </Insights>
  <Recommendations>`;
          
          insights.recommendations.forEach((recommendation, index) => {
            xmlContent += `
    <Recommendation id="${index + 1}">
      <Content>${recommendation}</Content>
    </Recommendation>`;
          });
          
          xmlContent += `
  </Recommendations>
</FinancialReport>`;
          
          // Convert XML to base64 for email sending
          fileData = btoa(unescape(encodeURIComponent(xmlContent)));
          fileName_final = `${baseFileName}.xml`;
          contentType = 'application/xml';
          break;
          
        default:
          throw new Error('Invalid export format selected');
      }

      // Send the email using our API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(buildApiUrl('api/email/send-professional-report'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: email,
          recipientName: 'User', // Default recipient name
          fileData: fileData,
          fileName: fileName_final,
          contentType: contentType,
          exportFormat: format,
          workspaceName: workspace?.name || 'Financial Analysis',
          customMessage: `Please find attached the financial analysis report in ${format.toUpperCase()} format.`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        title: 'Email Sent',
        message: `Report successfully sent to ${email} as ${format.toUpperCase()}!`
      });
      
      // Close the modal
      setShowEmailModal(false);
    } catch (err: any) {
      console.error('Error sending email:', err);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Email Failed',
        message: err.message || 'Failed to send email'
      });
    } finally {
      setSending(false);
    }
  };

  // Function to generate tax optimization suggestions
  const generateTaxOptimizationSuggestions = async () => {
    if (!csvContent || !fileName) {
      setNotification({
        show: true,
        type: 'error',
        title: 'No Data Available',
        message: 'Please upload and analyze financial data first before generating tax optimization suggestions.'
      });
      return;
    }

    setGeneratingTaxOptimization(true);
    
    try {
      console.log('Generating tax optimization suggestions...');
      const result = await taxOptimizationService.generateTaxOptimizationSuggestions(
        csvContent,
        fileName
      );
      
      setTaxOptimizationResult(result);
      setShowTaxOptimizationModal(true);
      
      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        title: 'Tax Optimization Complete',
        message: 'AI-powered tax optimization suggestions have been generated successfully.'
      });
    } catch (err: any) {
      console.error('Error generating tax optimization suggestions:', err);
      setError(`Failed to generate tax optimization suggestions: ${err.message}`);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Tax Optimization Failed',
        message: err.message || 'Failed to generate tax optimization suggestions'
      });
    } finally {
      setGeneratingTaxOptimization(false);
    }
  };

  // Function to handle tax optimization modal close
  const handleTaxOptimizationModalClose = () => {
    setShowTaxOptimizationModal(false);
  };

  // Function to export tax optimization report
  const handleTaxOptimizationReportExport = (report: string) => {
    try {
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-optimization-report-${fileName?.replace(/\.[^/.]+$/, '') || 'analysis'}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setNotification({
        show: true,
        type: 'success',
        title: 'Report Downloaded',
        message: 'Tax optimization report has been downloaded successfully.'
      });
    } catch (error) {
      console.error('Error exporting tax optimization report:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export tax optimization report.'
      });
    }
  };

  // Add a component for data validation error popup
  const DataValidationErrorModal = () => {
    if (!showDataValidationError) return null;
    
    return (
      <div className={styles.modalOverlay}>
        <motion.div 
          className={styles.modalContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h3>Non-Financial Data Detected</h3>
          <p>The uploaded file does not appear to contain financial data. The application is designed to analyze financial datasets.</p>
          <p>Please upload data that includes financial information such as revenue, expenses, profit/loss, cash flow, or other financial metrics.</p>
          
          <div className={styles.modalButtons}>
            <button 
              type="button" 
              className={styles.saveButton}
              onClick={() => setShowDataValidationError(false)}
            >
              Understand
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Function to fetch dataset versions
  const fetchDatasetVersions = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoadingVersions(true);
    try {
      const response = await fetch(buildApiUrl(`api/workspaces/${id}/dataset-versions`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dataset versions');
      }

      const data = await response.json();
      setDatasetVersions(data.data || []);
    } catch (err: any) {
      console.error('Error fetching dataset versions:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load dataset versions'
      });
    } finally {
      setLoadingVersions(false);
    }
  };

  // Function to open version history modal
  const handleVersionHistory = async () => {
    setShowVersionHistory(true);
    await fetchDatasetVersions();
  };

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to get file type icon
  const getFileTypeIcon = (fileName: string): string => {
    if (!fileName) {
      return '📁';
    }
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return '📄';
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'json':
        return '📋';
      default:
        return '📁';
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/dashboard">
            <button className={styles.backButton}>Back to Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspaceContainer}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className={styles.container}>
        <div className={styles.workspaceLayout}>
          {/* Sidebar with history */}
          <motion.div 
            className={styles.sidebar}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>History</h2>
            </div>
            <div className={styles.previousInsights}>
              <button 
                className={styles.versionHistoryButton}
                onClick={handleVersionHistory}
                title="View Dataset Version History"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={styles.versionIcon}
                >
                  <path d="M3 3v5h5"></path>
                  <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
                  <path d="M12 7v5l4 2"></path>
                </svg>
                Version History
              </button>
              <h3>Previously generated insights</h3>
              {savedInsights.length > 0 ? (
                <div className={styles.insightsList}>
                  {savedInsights.map((insight) => (
                    <motion.div 
                      key={insight._id}
                      className={styles.insightItem}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openInsightDetails(insight)}
                    >
                      <div className={styles.insightContent}>
                        <h4>{insight.fileName}</h4>
                        <p>{formatDate(insight.createdAt)}</p>
                      </div>
                      
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className={styles.noInsights}>No insights generated yet</p>
              )}
            </div>
          </motion.div>

          {/* Main content area */}
          <div className={styles.mainContent}>
            {/* Header */}
            <motion.div 
              className={styles.header}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link href="/dashboard">
                <motion.button 
                  className={styles.backButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  &larr; back to dashboard
                </motion.button>
              </Link>
              
              <div className={styles.workspaceTitle}>
                <h1>{workspace?.name || 'Session name'}</h1>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className={styles.workspaceDate}>
                  <p>Created: {workspace ? formatDate(workspace.createdAt) : '—'}</p>
                  <p>Last updated: {workspace ? formatDate(workspace.updatedAt) : '—'}</p>
                </div>
                <ThemeToggle />
              </div>
            </motion.div>

            {/* Upload area */}
            <motion.div 
              className={styles.uploadArea}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className={styles.disclaimerBox}>
                Disclaimer: This product can be leveraged to different business needs and doesn't limit to financial industry only
              </div>
                <div id="csv-uploader" className={styles.uploaderContainer}>
                <CsvUploader 
                  onFileUploadAction={handleFileUpload} 
                  isLoading={analyzing}
                  workspaceId={id}
                />
              </div>
            </motion.div>

            {/* Content Tabs */}
            <motion.div 
              className={styles.contentArea}
              ref={contentRef}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: insights ? 1 : 0,
                height: insights ? 'auto' : '0'
              }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'summary' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('summary')}
                  >
                    Summary
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'insights' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('insights')}
                  >
                    Insights
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'recommendations' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('recommendations')}
                  >
                    Recommendations
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'visualizations' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('visualizations')}
                  >
                    Visualizations
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'storyMode' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('storyMode')}
                  >
                    Story Mode
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'assistant' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('assistant')}
                  >
                    Assistant
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'notes' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('notes')}
                  >
                    Notes
                  </button>
                </div>
              </div>              

              {/* Tab content */}
              {insights && (
                <div className={styles.allTabContents}>
                  <div className={styles.tabContentWrapper}>
                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'summary' ? 'block' : 'none' }}
                    >
                      <div className={styles.summaryContent}>
                        {/* Add insight cards at the top - use saved cards if available */}
                        {savedInsightCards ? (
                          <InsightCards cards={savedInsightCards} />
                        ) : (
                          insights && <InsightCards cards={getNumericalInsightsFromData(insights)} />
                        )}
                        
                        <h3>Financial Summary</h3>
                        <p>{insights.summary}</p>
                      </div>
                    </div>
                    
                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'insights' ? 'block' : 'none' }}
                    >
                      <div className={styles.insightsContent}>
                        <h3>Key Insights</h3>
                        {Array.isArray(insights?.insights) && insights.insights.length > 0 ? (
                          <ul>
                            {insights.insights.map((insight, index) => (
                              <motion.li 
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                {insight}
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p>No insights available for this analysis.</p>
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'recommendations' ? 'block' : 'none' }}
                    >
                      <div className={styles.recommendationsContent}>
                        <h3>Recommendations</h3>
                        {Array.isArray(insights?.recommendations) && insights.recommendations.length > 0 ? (
                          <ul>
                            {insights.recommendations.map((recommendation, index) => (
                              <motion.li 
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                {recommendation}
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p>No recommendations available for this analysis.</p>
                        )}
                        
                        {/* Tax Optimization Button */}
                        <div className={styles.taxOptimizationSection}>
                          <h4>AI-Powered Tax Optimization</h4>
                          <p style={{ color: '#3b82f6' }}>Get personalized tax optimization suggestions based on your financial data.</p>
                          <button
                            className={styles.taxOptimizationButton}
                            onClick={generateTaxOptimizationSuggestions}
                            disabled={generatingTaxOptimization || !csvContent}
                          >
                            {generatingTaxOptimization ? (
                              <>
                                <div className={styles.buttonSpinner}></div>
                                Generating Suggestions...
                              </>
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M17,13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
                                </svg>
                                Get Tax Optimization Suggestions
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'visualizations' ? 'block' : 'none' }}
                    >
                      <div className={styles.visualizationsContent}>
                        <VisualizationPanel 
                          charts={charts} 
                          fileName={fileName}
                          isLoading={generatingCharts}
                        />
                      </div>
                    </div>

                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'storyMode' ? 'block' : 'none' }}
                    >
                      <div className={styles.storyModeContent}>
                        <StoryMode 
                          csvData={csvContent}
                          fileName={fileName}
                          insights={insights}
                          isEnabled={!!insights}
                          chartData={charts || []}
                        />
                      </div>
                    </div>

                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'assistant' ? 'block' : 'none' }}
                    >
                      <div className={styles.assistantContent}>
                        <FinancialAssistant 
                          csvData={csvContent ? csvContent : null}
                          fileName={fileName}
                          isEnabled={!!insights}
                          onMessagesChange={handleAssistantMessagesChange}
                          initialMessages={assistantMessages}
                        />
                      </div>
                    </div>

                    <div 
                      className={styles.tabContentWrapper} 
                      style={{ display: activeTab === 'notes' ? 'block' : 'none' }}
                    >
                      <div className={styles.notesContent}>
                        <h3>Your Notes</h3>
                        <p>Write notes about your data analysis. Use bullet points to organize your thoughts:</p>
                        <textarea 
                          className={styles.notesTextarea}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          onFocus={(e) => {
                            // If textarea is empty when focused, add initial bullet point
                            if (notes.trim() === '') {
                              setNotes('• ');
                              setTimeout(() => {
                                e.target.selectionStart = 2;
                                e.target.selectionEnd = 2;
                              }, 0);
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const textarea = e.currentTarget;
                              const cursorPosition = textarea.selectionStart;
                              const textBeforeCursor = notes.substring(0, cursorPosition);
                              const textAfterCursor = notes.substring(cursorPosition);
                              
                              // Add new line with bullet point
                              const newText = textBeforeCursor + '\n• ' + textAfterCursor;
                              setNotes(newText);
                              
                              // Set cursor position after the bullet point
                              setTimeout(() => {
                                textarea.selectionStart = cursorPosition + 3; // 3 characters: \n•(space)
                                textarea.selectionEnd = cursorPosition + 3;
                                textarea.focus();
                              }, 0);
                            }
                          }}
                          placeholder="• Key insight 1&#10;• Important observation&#10;• Action item&#10;&#10;Write your notes here..."
                          style={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: '14px',
                            lineHeight: '1.6'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Save/Export/Email buttons */}
                  <div className={styles.saveButtonContainer}>
                    {!isViewingHistory && (
                      <motion.button
                        className={styles.saveButton}
                        onClick={saveInsightsToDatabase}
                        disabled={saving || exporting || sending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {saving ? (
                          <>
                            <div className={styles.buttonSpinner}></div>
                            Saving...
                          </>
                        ) : (
                          'Save Insights'
                        )}
                      </motion.button>
                    )}
                    
                    {!isViewingHistory && insights && (
                      <motion.button
                        className={styles.reportButton}
                        onClick={async () => {
                          // Generate a unique report ID based on the file name and current timestamp
                          const reportId = fileName ? 
                            `${fileName.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '')}-${Date.now().toString(36)}` : 
                            `report-${Date.now().toString(36)}`;
                          
                          // Save the current session's uploaded files data to be used by the report
                          try {
                            const token = localStorage.getItem('token');
                            
                            console.log('[Workspace] Saving session data for report:', {
                              reportId,
                              uploadedFilesCount: uploadedFiles.length,
                              uploadedFiles: uploadedFiles.map(f => ({ fileName: f.fileName, contentLength: f.content.length }))
                            });
                            
                            // Ensure we have valid data before saving
                            if (uploadedFiles.length === 0) {
                              console.warn('[Workspace] No uploaded files to save for report');
                            }
                            
                            const currentSessionData = {
                              reportId,
                              uploadedFiles: uploadedFiles.map(file => ({
                                content: file.content,
                                fileName: file.fileName
                              })),
                              generatedAt: new Date().toISOString(),
                              workspaceName: workspace?.name || 'Workspace'
                            };
                            
                            // Store the session data for this specific report
                            const response = await fetch(buildApiUrl(`api/workspaces/${params.id}/report/${reportId}`), {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                data: currentSessionData
                              })
                            });
                            
                            if (!response.ok) {
                              throw new Error(`Server error: ${response.status} ${response.statusText}`);
                            }
                            
                            console.log('[Workspace] Session data saved successfully');
                          } catch (error) {
                            console.error('Failed to save current session data for report:', error);
                            // Continue with navigation even if save fails
                          }
                          
                          router.push(`/workspace/${params.id}/report/${reportId}`);
                        }}
                        disabled={saving || exporting || sending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Report
                      </motion.button>
                    )}
                    
                    <div 
                      className={styles.exportDropdown}
                      style={{ 
                        position: 'relative', 
                        zIndex: 1000,
                        overflow: 'visible',
                        display: 'inline-block'
                      }}
                    >
                      <motion.button
                        className={styles.exportButton}
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        disabled={saving || exporting || sending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {exporting ? (
                          <>
                            <div className={styles.buttonSpinner}></div>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={styles.exportIcon} 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={styles.dropdownArrow} 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </>
                        )}
                      </motion.button>
                      
                      {showExportDropdown && (
                        <div 
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: '0',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            zIndex: 999999,
                            width: '200px',
                            boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            marginBottom: '8px',
                            maxHeight: '200px',
                            overflow: 'visible',
                            animation: 'dropdownFadeIn 0.2s ease-out'
                          }}
                        >
                          <style>{`
                            @keyframes dropdownFadeIn {
                              from {
                                opacity: 0;
                                transform: translateY(-10px);
                              }
                              to {
                                opacity: 1;
                                transform: translateY(0);
                              }
                            }
                            .dropdown-item {
                              display: flex !important;
                              align-items: center !important;
                              width: 100% !important;
                              padding: 12px 16px !important;
                              text-align: left !important;
                              background: none !important;
                              border: none !important;
                              color: #374151 !important;
                              font-size: 14px !important;
                              font-weight: 500 !important;
                              cursor: pointer !important;
                              transition: all 0.15s ease !important;
                              border-radius: 6px !important;
                              margin: 4px !important;
                            }
                            .dropdown-item:hover {
                              background-color: #f3f4f6 !important;
                              color: #4f46e5 !important;
                              transform: translateX(4px) !important;
                            }
                            .dropdown-item:active {
                              background-color: #e5e7eb !important;
                              transform: translateX(2px) !important;
                            }
                            .dropdown-item:first-child {
                              border-top-left-radius: 8px !important;
                              border-top-right-radius: 8px !important;
                            }
                            .dropdown-item:last-child {
                              border-bottom-left-radius: 8px !important;
                              border-bottom-right-radius: 8px !important;
                            }
                            .dropdown-icon {
                              width: 18px !important;
                              height: 18px !important;
                              margin-right: 12px !important;
                              color: #6b7280 !important;
                              transition: color 0.15s ease !important;
                            }
                            .dropdown-item:hover .dropdown-icon {
                              color: #4f46e5 !important;
                            }
                          `}</style>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setShowExportDropdown(false);
                              exportToPdf();
                            }}
                            disabled={exporting}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="dropdown-icon" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>Export as PDF</span>
                          </button>
                          
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setShowExportDropdown(false);
                              exportToWord();
                            }}
                            disabled={exporting}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="dropdown-icon" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="12" y1="11" x2="12" y2="17"></line>
                              <polyline points="9 14 12 17 15 14"></polyline>
                            </svg>
                            <span>Export as Word</span>
                          </button>
                          
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setShowExportDropdown(false);
                              exportToXML();
                            }}
                            disabled={exporting}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="dropdown-icon" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
                              <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
                            </svg>
                            <span>Export as XML</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <motion.button
                      className={styles.emailButton}
                      onClick={() => setShowEmailModal(true)}
                      disabled={saving || exporting || sending}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={styles.emailIcon} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>                      Send via Email
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <EmailModal 
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSubmit={sendEmailWithPdf}
            sending={sending}
          />
        )}
      </AnimatePresence>
      
      {/* Insight Details Modal with Visualizations */}
      <AnimatePresence>
        {showInsightDetails && selectedInsight && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.insightDetailsModal}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >              <div className={styles.modalHeader}>
                <h3>{selectedInsight.fileName}</h3>
                <div className={styles.modalHeaderButtons}>
                  <button 
                    className={styles.reportButton}
                    onClick={async () => {
                      // Generate a unique report ID based on the file name and current timestamp
                      const reportId = selectedInsight.fileName ? 
                        `${selectedInsight.fileName.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '')}-${Date.now().toString(36)}` : 
                        `report-${Date.now().toString(36)}`;
                      
                      // Save the selected insight's data to be used by the report
                      try {
                        const token = localStorage.getItem('token');
                        const insightSessionData = {
                          reportId,
                          savedInsightData: {
                            fileName: selectedInsight.fileName,
                            summary: selectedInsight.summary,
                            insights: selectedInsight.insights,
                            recommendations: selectedInsight.recommendations,
                            charts: selectedInsight.charts,
                            assistantChat: selectedInsight.assistantChat,
                            insightCards: selectedInsight.insightCards
                          },
                          generatedAt: new Date().toISOString(),
                          workspaceName: workspace?.name || 'Workspace',
                          isFromSavedInsight: true
                        };
                        
                        // Store the insight data for this specific report
                        await fetch(buildApiUrl(`api/workspaces/${params.id}/report/${reportId}`), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            data: insightSessionData
                          })
                        });
                      } catch (error) {
                        console.warn('Failed to save insight data for report:', error);
                        // Continue with navigation even if save fails
                      }
                      
                      router.push(`/workspace/${params.id}/report/${reportId}`);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    Report
                  </button>
                  <button 
                    className={styles.closeButton}
                    onClick={() => setShowInsightDetails(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className={styles.modalTabs}>
                <button 
                  className={`${styles.modalTab} ${detailsTab === 'insights' ? styles.activeModalTab : ''}`}
                  onClick={() => setDetailsTab('insights')}
                >
                  Insights
                </button>
                {selectedInsight.charts && Array.isArray(selectedInsight.charts) && selectedInsight.charts.length > 0 && (
                  <button 
                    className={`${styles.modalTab} ${detailsTab === 'visualizations' ? styles.activeModalTab : ''}`}
                    onClick={() => setDetailsTab('visualizations')}
                  >
                    Visualizations
                  </button>
                )}
                {selectedInsight.assistantChat && Array.isArray(selectedInsight.assistantChat) && selectedInsight.assistantChat.length > 0 && (
                  <button 
                    className={`${styles.modalTab} ${detailsTab === 'assistantChat' ? styles.activeModalTab : ''}`}
                    onClick={() => setDetailsTab('assistantChat')}
                  >
                    Chat History
                  </button>
                )}
                {selectedInsight.notes && (
                  <button 
                    className={`${styles.modalTab} ${detailsTab === 'notes' ? styles.activeModalTab : ''}`}
                    onClick={() => {
                      console.log('Notes tab clicked, current notes:', selectedInsight.notes); // Debug log
                      setDetailsTab('notes');
                    }}
                  >
                    Notes
                  </button>
                )}
              </div>
              
              <div className={styles.modalContent}>
                <AnimatePresence mode="wait">
                  {detailsTab === 'insights' && (
                    <motion.div
                      key="details-insights"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Display insight cards if available */}
                      {selectedInsight.insightCards && selectedInsight.insightCards.length > 0 && (
                        <div className={styles.modalInsightCardsContainer}>
                          <InsightCards cards={selectedInsight.insightCards} />
                        </div>
                      )}
                      
                      <div className={styles.insightSummary}>
                        <h4>Summary</h4>
                        <p>{selectedInsight.summary}</p>
                      </div>
                      
                      <div className={styles.insightFindings}>
                        <h4>Key Insights</h4>
                        <ul>
                          {Array.isArray(selectedInsight.insights) 
                            ? cleanTextArray(selectedInsight.insights).map((insight, index) => (
                                <li key={index}>{insight}</li>
                              ))
                            : typeof selectedInsight.insights === 'string'
                              ? cleanText(selectedInsight.insights).split('\n\n').map((insight, index) => (
                                  <li key={index}>{insight}</li>
                                ))
                              : <li>No insights available</li>
                          }
                        </ul>
                      </div>
                      
                      <div className={styles.insightRecommendations}>
                        <h4>Recommendations</h4>
                        <ul>
                          {Array.isArray(selectedInsight.recommendations) 
                            ? cleanTextArray(selectedInsight.recommendations).map((recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              ))
                            : typeof selectedInsight.recommendations === 'string'
                              ? cleanText(selectedInsight.recommendations).split('\n\n').map((recommendation, index) => (
                                  <li key={index}>{recommendation}</li>
                                ))
                              : <li>No recommendations available</li>
                          }
                        </ul>
                      </div>
                    </motion.div>
                  )}
                  
                  {detailsTab === 'visualizations' && selectedInsight.charts && Array.isArray(selectedInsight.charts) && selectedInsight.charts.length > 0 && (
                    <motion.div
                      key="details-visualizations"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.visualizationsContainer}
                    >
                      <VisualizationPanel 
                        charts={selectedInsight.charts}
                        fileName={selectedInsight.fileName}
                        isLoading={generatingCharts}
                      />
                    </motion.div>
                  )}
                  
                  {detailsTab === 'assistantChat' && selectedInsight.assistantChat && Array.isArray(selectedInsight.assistantChat) && selectedInsight.assistantChat.length > 0 && (
                    <motion.div
                      key="details-assistantChat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.assistantChatContainer}
                    >
                      <div className={styles.chatHistory}>
                        <h4>Chat History</h4>
                        <div className={styles.messagesWrapper}>
                          <AnimatePresence>
                            {selectedInsight.assistantChat.length === 0 ? (
                              <div className={styles.emptyChat}>
                                <p>No chat history available for this analysis.</p>
                              </div>
                            ) : (
                              selectedInsight.assistantChat.map((message, index) => (
                                <motion.div
                                  key={index}
                                  className={`${styles.chatMessage} ${message.sender === 'user' ? styles.userMessage : styles.assistantMessage}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                  <div className={styles.messageContent}>
                                    {message.sender === 'assistant' ? (
                                      <div className={styles.formattedText}>
                                        {formatChatMessage(message.text)}
                                      </div>
                                    ) : (
                                      message.text
                                    )}
                                  </div>
                                  <div className={styles.messageTime}>
                                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {detailsTab === 'notes' && selectedInsight.notes && (
                    <motion.div
                      key="details-notes"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.notesContainer}
                    >
                      <div className={styles.savedNotes}>
                        <h4>Saved Notes</h4>
                        <div className={styles.notesDisplay}>
                          {selectedInsight.notes.split('\n').map((line, index) => (
                            <p key={index} style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14px', lineHeight: '1.6' }}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  className={styles.modalCloseButton}
                  onClick={() => setShowInsightDetails(false)}
                >
                  Close
                </button>
                
                <div className={styles.modalExportDropdown}>
                  <button
                    className={styles.modalExportButton}
                    onClick={() => setShowModalExportDropdown(!showModalExportDropdown)}
                  >
                    Export
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={styles.modalDropdownArrow} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {showModalExportDropdown && (
                    <div className={styles.modalDropdownMenu}>
                      <button
                        className={styles.modalDropdownItem}
                        onClick={() => {
                          setShowModalExportDropdown(false);
                          // Instead of setting state and exporting after delay, directly generate PDF from selectedInsight
                          if (!selectedInsight) return;
                          
                          setExporting(true);
                          
                          try {
                            // Create temporary insights object for PDF generation
                            const tempInsights = {
                              summary: selectedInsight.summary,
                              insights: Array.isArray(selectedInsight.insights) 
                                ? selectedInsight.insights
                                : typeof selectedInsight.insights === 'string'
                                  ? selectedInsight.insights.split('\n\n').filter(Boolean)
                                  : [],
                              recommendations: Array.isArray(selectedInsight.recommendations)
                                ? selectedInsight.recommendations
                                : typeof selectedInsight.recommendations === 'string'
                                  ? selectedInsight.recommendations.split('\n\n').filter(Boolean)
                                  : [],
                              rawResponse: selectedInsight.rawResponse
                            };
                            
                            // Create a new PDF document
                            const doc = new jsPDF();                      // Set document properties
                      doc.setProperties({
                        title: `Financial Insights - ${selectedInsight.fileName}`,
                        subject: 'Financial Analysis Report',
                        author: 'Finaxial App',
                        creator: 'Finaxial App'
                      });
                      
                      // Define PDF layout constants
                      const footerPosition = 280;
                      const footerMargin = 15; // Margin above footer to prevent content overflow
                      
                      // Add title
                      doc.setFontSize(20);
                      doc.setTextColor(33, 37, 41);
                      doc.text(`Financial Insights Report`, 15, 20);
                      
                      // Add file info
                      doc.setFontSize(12);
                      doc.setTextColor(100, 100, 100);
                      doc.text(`File: ${selectedInsight.fileName}`, 15, 30);
                      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 36);
                      
                      // Add divider
                      doc.setDrawColor(200, 200, 200);
                      doc.line(15, 40, 195, 40);
                      
                      // Variables for positioning
                      let currentY = 50;
                      let summaryEndY = 0;
                      
                      // Add insight cards section if available
                      if (selectedInsight.insightCards && Array.isArray(selectedInsight.insightCards) && selectedInsight.insightCards.length > 0) {
                        // Add Key Metrics section for insight cards
                        doc.setFontSize(16);
                        doc.setTextColor(33, 37, 41);
                        doc.text('Key Metrics', 15, currentY);
                        
                        // Create a table for insight cards
                        const cardsTableData = selectedInsight.insightCards.map(card => {
                          const changeText = card.change ? 
                            `${card.change.positive ? '+' : '-'}${Math.abs(card.change.value)}%` : 
                            'N/A';
                          return [card.label, card.value.toString(), changeText];
                        });
                        
                        autoTable(doc, {
                          startY: currentY + 5,
                          head: [['Metric', 'Value', 'Change']],
                          body: cardsTableData,
                          theme: 'grid',
                          headStyles: { 
                            fillColor: [79, 70, 229],
                            textColor: 255
                          },
                          columnStyles: {
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 40, halign: 'center' },
                            2: { cellWidth: 40, halign: 'center' }
                          },
                          styles: {
                            cellPadding: 5,
                            fontSize: 10
                          },
                          margin: { bottom: 10 }
                        });
                        
                        // Update current Y position after drawing the insight cards table
                        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 85;
                      }
                      
                      // Add summary section
                      doc.setFontSize(16);
                      doc.setTextColor(33, 37, 41);
                      doc.text('Summary', 15, currentY);
                      
                      // Split summary into lines to fit page width
                      doc.setFontSize(11);
                      doc.setTextColor(75, 85, 99);
                      const textLines = doc.splitTextToSize(tempInsights.summary, 170);
                      doc.text(textLines, 15, currentY + 10);
                      
                      summaryEndY = Math.min(currentY + 10 + textLines.length * 5, 260);
                      
                      // Add key insights section
                      doc.setFontSize(16);
                      doc.setTextColor(33, 37, 41);
                      doc.text('Key Insights', 15, summaryEndY + 10);
                      
                      // Format insights as a table
                      const insightsData = Array.isArray(tempInsights.insights) 
                        ? tempInsights.insights.map((insight, index) => [`${index + 1}.`, insight]) 
                        : [['', 'No insights available']];
                      
                      autoTable(doc, {
                        startY: summaryEndY + 15,
                        head: [['#', 'Insight']],
                        body: insightsData,
                        theme: 'grid',
                        headStyles: { 
                          fillColor: [79, 70, 229],
                          textColor: 255
                        },
                        styles: {
                          overflow: 'linebreak',
                          cellWidth: 'auto'
                        },
                        columnStyles: {
                          0: { cellWidth: 10 },
                          1: { cellWidth: 'auto' }
                        },
                        margin: { bottom: footerMargin + 10 }
                      });
                      
                      // Check if we need a new page for recommendations
                      if (doc.lastAutoTable && doc.lastAutoTable.finalY > 220) {
                        doc.addPage();
                        // Reset Y position for new page
                        doc.lastAutoTable.finalY = 20;
                      }
                      
                      // Add recommendations section
                      doc.setFontSize(16);
                      doc.setTextColor(33, 37, 41);
                        const recY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : summaryEndY + 130;
                      doc.text('Recommendations', 15, recY);
                      
                      // Format recommendations as a table
                      const recData = Array.isArray(tempInsights.recommendations) 
                        ? tempInsights.recommendations.map((rec, index) => [`${index + 1}.`, rec]) 
                        : [['', 'No recommendations available']];
                        autoTable(doc, {
                        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : recY + 5,
                        head: [['#', 'Recommendation']],
                        body: recData,
                        theme: 'grid',
                        headStyles: { 
                          fillColor: [79, 70, 229],
                          textColor: 255
                        },
                        styles: {
                          overflow: 'linebreak',
                          cellWidth: 'auto'
                        },
                        columnStyles: {
                          0: { cellWidth: 10 },
                          1: { cellWidth: 'auto' }
                        },
                        margin: { bottom: footerMargin + 10 }
                      });
                      
                      // Add visualizations section if charts are available
                      if (selectedInsight.charts && Array.isArray(selectedInsight.charts) && selectedInsight.charts.length > 0) {
                        // Add a new page for charts
                        doc.addPage();
                        
                        // Add visualizations section title
                        doc.setFontSize(16);
                        doc.setTextColor(33, 37, 41);
                        doc.text('Visualizations', 15, 20);
                        
                        let currentY = 30;
                        const chartWidth = 180;
                        const chartHeight = 100;
                        
                        // Loop through charts (max 2 per page)
                        selectedInsight.charts.forEach((chart, index) => {
                          // Calculate estimated height for this chart (title + chart + description)
                          const estimatedHeight = 8 + chartHeight + 20; // Basic height without description
                          
                          // Check if we need a new page based on vertical space
                          if (currentY + estimatedHeight > footerPosition - footerMargin) {
                            doc.addPage();
                            currentY = 30;
                          } else if (index > 0 && index % 2 === 0) {
                            // Create a new page after every 2 charts (original logic)
                            doc.addPage();
                            currentY = 30;
                          }
                          
                          // Add chart title
                          doc.setFontSize(14);
                          doc.setTextColor(33, 37, 41);
                          doc.text(chart.title, 15, currentY);
                          currentY += 8;
                          
                          try {
                            // Create a temporary canvas for chart rendering
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = chartWidth * 5;  // Higher resolution for better quality
                            tempCanvas.height = chartHeight * 5;
                            tempCanvas.style.width = `${chartWidth}px`;
                            tempCanvas.style.height = `${chartHeight}px`;
                            document.body.appendChild(tempCanvas);
                            
                            // Create chart instance
                            const chartInstance = new ChartJS(tempCanvas, {
                              type: chart.type as keyof ChartTypeRegistry,
                              data: chart.data,
                              options: {
                                ...chart.options,
                                responsive: false,
                                animation: false,
                                plugins: {
                                  legend: {
                                    display: true,
                                    position: 'bottom'
                                  },
                                  title: {
                                    display: false
                                  }
                                }
                              }
                            });
                            
                            // Render chart and add to PDF
                            chartInstance.render();
                            const imageData = tempCanvas.toDataURL('image/png', 1.0);
                            doc.addImage(imageData, 'PNG', 15, currentY, chartWidth, chartHeight);
                            
                            // Clean up
                            chartInstance.destroy();
                            document.body.removeChild(tempCanvas);
                            
                            // Add chart description
                            currentY += chartHeight + 10;
                            doc.setFontSize(10);
                            doc.setTextColor(75, 85, 99);
                            const descriptionLines = doc.splitTextToSize(chart.description, 170);
                            doc.text(descriptionLines, 15, currentY);
                            
                            // Update Y position for next chart
                            currentY += descriptionLines.length * 5 + 20;
                          } catch (chartError) {
                            console.error('Error rendering chart in PDF:', chartError);
                            // Add error message instead of chart
                            doc.setFontSize(10);
                            doc.setTextColor(220, 53, 69);
                            doc.text(`Could not render chart: ${chart.title}`, 15, currentY);
                            currentY += 20;
                          }
                        });
                      }
                      
                      // Add footer with app name
                      const pageCount = doc.getNumberOfPages();
                      for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        
                        // Add footer line to visually separate content from footer
                        doc.setDrawColor(200, 200, 200);
                        doc.line(15, footerPosition - footerMargin, 195, footerPosition - footerMargin);
                        
                        // Add footer text
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.text('Finaxial App - Financial Insights Report', 15, footerPosition);
                        doc.text(`Page ${i} of ${pageCount}`, 180, footerPosition);
                      }
                      
                      // Save the PDF with a unique filename
                      doc.save(`financial-insights-${selectedInsight.fileName.replace(/\.[^/.]+$/, '')}.pdf`);
                      
                      // Show success notification
                      setNotification({
                        show: true,
                        type: 'success',
                        title: 'PDF Generated',
                        message: 'Report has been downloaded successfully.'
                      });
                    } catch (err: any) {
                      console.error('Error generating PDF from modal:', err);
                      
                      // Show error notification
                      setNotification({
                        show: true,
                        type: 'error',
                        title: 'PDF Generation Failed',
                        message: err.message || 'Failed to generate PDF report'
                      });
                            } finally {
                              setExporting(false);
                              setShowInsightDetails(false);
                            }
                          }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={styles.modalDropdownIcon} 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Export as PDF
                        </button>
                        
                        <button
                          className={styles.modalDropdownItem}
                          onClick={() => {
                            setShowModalExportDropdown(false);
                            if (!selectedInsight) return;
                            
                            setExporting(true);
                            
                            try {
                              // Create Word document content as HTML
                              let htmlContent = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <meta charset="UTF-8">
                                  <title>Financial Assistant Analysis Report</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                                    h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                                    h2 { color: #374151; margin-top: 30px; }
                                    .header-info { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
                                    .insight-item { margin-bottom: 15px; padding: 10px; background-color: #f9fafb; border-left: 4px solid #4f46e5; }
                                    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                                    th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
                                    th { background-color: #4f46e5; color: white; }
                                    .metrics-table { margin: 20px 0; }
                                  </style>
                                </head>
                                <body>
                                  <h1>Financial Assistant Analysis Report</h1>
                                  <div class="header-info">
                                    <p><strong>File:</strong> ${selectedInsight.fileName}</p>
                                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                                  </div>
                              `;

                              // Add Key Metrics if available
                              if (selectedInsight.insightCards && Array.isArray(selectedInsight.insightCards) && selectedInsight.insightCards.length > 0) {
                                htmlContent += `
                                  <h2>Key Metrics</h2>
                                  <table class="metrics-table">
                                    <tr><th>Metric</th><th>Value</th><th>Change</th></tr>
                                `;
                                
                                selectedInsight.insightCards.forEach(card => {
                                  const changeText = card.change ? 
                                    `${card.change.positive ? '+' : '-'}${Math.abs(card.change.value)}%` : 
                                    'N/A';
                                  htmlContent += `<tr><td>${card.label}</td><td>${card.value}</td><td>${changeText}</td></tr>`;
                                });
                                
                                htmlContent += `</table>`;
                              }

                              // Add Summary
                              htmlContent += `
                                <h2>Summary</h2>
                                <p>${selectedInsight.summary}</p>
                              `;

                              // Add Key Insights
                              if (Array.isArray(selectedInsight.insights) && selectedInsight.insights.length > 0) {
                                htmlContent += `<h2>Key Insights</h2>`;
                                selectedInsight.insights.forEach((insight, index) => {
                                  htmlContent += `<div class="insight-item">${index + 1}. ${insight}</div>`;
                                });
                              }

                              htmlContent += `
                                </body>
                                </html>
                              `;

                              // Create and download the Word document
                              const blob = new Blob([htmlContent], { type: 'application/msword' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${selectedInsight.fileName.replace(/\.[^/.]+$/, '')}-report.doc`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);

                              setNotification({
                                show: true,
                                type: 'success',
                                title: 'Word Document Exported',
                                message: 'Report has been downloaded successfully.'
                              });
                            } catch (error) {
                              console.error('Error exporting Word document:', error);
                              setNotification({
                                show: true,
                                type: 'error',
                                title: 'Word Export Failed',
                                message: 'Failed to export Word document'
                              });
                            } finally {
                              setExporting(false);
                              setShowInsightDetails(false);
                            }
                          }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={styles.modalDropdownIcon} 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <polyline points="9 14 12 17 15 14"></polyline>
                          </svg>
                          Export as Word
                        </button>
                        
                        <button
                          className={styles.modalDropdownItem}
                          onClick={() => {
                            setShowModalExportDropdown(false);
                            if (!selectedInsight) return;
                            
                            setExporting(true);
                            
                            try {
                              // Create XML content
                              let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinancialReport>
  <Header>
    <Title>Financial Assistant Analysis Report</Title>
    <FileName>${selectedInsight.fileName}</FileName>
    <GeneratedDate>${new Date().toISOString()}</GeneratedDate>
  </Header>
                              `;

                              // Add Key Metrics if available
                              if (selectedInsight.insightCards && Array.isArray(selectedInsight.insightCards) && selectedInsight.insightCards.length > 0) {
                                xmlContent += `
  <KeyMetrics>`;
                                
                                selectedInsight.insightCards.forEach(card => {
                                  const changeValue = card.change ? card.change.value : 0;
                                  const changeDirection = card.change ? (card.change.positive ? 'positive' : 'negative') : 'none';
                                  xmlContent += `
    <Metric>
      <Label>${card.label}</Label>
      <Value>${card.value}</Value>
      <Change direction="${changeDirection}">${changeValue}</Change>
    </Metric>`;
                                });
                                
                                xmlContent += `
  </KeyMetrics>`;
                              }

                              // Add Summary
                              xmlContent += `
  <Summary><![CDATA[${selectedInsight.summary}]]></Summary>
                              `;

                              // Add Key Insights
                              if (Array.isArray(selectedInsight.insights) && selectedInsight.insights.length > 0) {
                                xmlContent += `
  <KeyInsights>`;
                                selectedInsight.insights.forEach((insight, index) => {
                                  xmlContent += `
    <Insight id="${index + 1}"><![CDATA[${insight}]]></Insight>`;
                                });
                                xmlContent += `
  </KeyInsights>`;
                              }

                              xmlContent += `
</FinancialReport>`;

                              // Create and download the XML file
                              const blob = new Blob([xmlContent], { type: 'application/xml' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${selectedInsight.fileName.replace(/\.[^/.]+$/, '')}-report.xml`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);

                              setNotification({
                                show: true,
                                type: 'success',
                                title: 'XML File Exported',
                                message: 'Report has been downloaded successfully.'
                              });
                            } catch (error) {
                              console.error('Error exporting XML file:', error);
                              setNotification({
                                show: true,
                                type: 'error',
                                title: 'XML Export Failed',
                                message: 'Failed to export XML file'
                              });
                            } finally {
                              setExporting(false);
                              setShowInsightDetails(false);
                            }
                          }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={styles.modalDropdownIcon} 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
                            <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
                          </svg>
                          Export as XML
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                  className={styles.modalEmailButton}
                  onClick={() => {
                    // Handle email functionality properly
                    if (!selectedInsight) return;
                    
                    // Set the current insights state for email functionality
                    setInsights({
                      summary: selectedInsight.summary,
                      insights: Array.isArray(selectedInsight.insights) 
                        ? selectedInsight.insights
                        : typeof selectedInsight.insights === 'string'
                          ? selectedInsight.insights.split('\n\n').filter(Boolean)
                          : [],
                      recommendations: Array.isArray(selectedInsight.recommendations)
                        ? selectedInsight.recommendations
                        : typeof selectedInsight.recommendations === 'string'
                          ? selectedInsight.recommendations.split('\n\n').filter(Boolean)
                          : [],
                      rawResponse: selectedInsight.rawResponse
                    });
                    
                    setFileName(selectedInsight.fileName);
                    
                    // Also set charts data if available
                    if (selectedInsight.charts && Array.isArray(selectedInsight.charts)) {
                      setCharts(selectedInsight.charts);
                    }
                    
                    // Close the details modal first, then show email modal
                    setShowInsightDetails(false);
                    
                    // Use a timeout to ensure state updates before showing email modal
                    setTimeout(() => {
                      setShowEmailModal(true);
                    }, 100);
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={styles.modalFooterIcon} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Send via Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Version History Modal */}
      <AnimatePresence>
        {showVersionHistory && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVersionHistory(false)}
          >
            <motion.div 
              className={styles.versionHistoryModal}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.versionModalHeader}>
                <div className={styles.versionModalTitle}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={styles.versionModalIcon}
                  >
                    <path d="M3 3v5h5"></path>
                    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
                    <path d="M12 7v5l4 2"></path>
                  </svg>
                  <h3>Dataset Version History</h3>
                </div>
                <button 
                  className={styles.versionModalClose}
                  onClick={() => setShowVersionHistory(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className={styles.versionModalContent}>
                {loadingVersions ? (
                  <div className={styles.versionLoading}>
                    <div className={styles.spinner}></div>
                    <p>Loading version history...</p>
                  </div>
                ) : datasetVersions.length > 0 ? (
                  <div className={styles.versionTableContainer}>
                    <table className={styles.versionTable}>
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>File Name</th>
                          <th>Data Info</th>
                          <th>Changes</th>
                          <th>Type</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasetVersions.map((version) => (
                          <tr key={version._id} className={styles.versionRow}>
                            <td>
                              <span className={styles.versionBadge}>
                                v{version.version}
                              </span>
                            </td>
                            <td>
                              <div className={styles.fileNameCell}>
                                <span className={styles.fileName}>
                                  {version.fileName || version.originalFileName || 'Unknown file'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.dataInfo}>
                                {version.metadata && (
                                  <>
                                    {version.metadata.rowCount && (
                                      <span>{version.metadata.rowCount.toLocaleString()} rows</span>
                                    )}
                                    {version.metadata.columnCount && (
                                      <span>{version.metadata.columnCount} columns</span>
                                    )}
                                    {version.metadata.sheets && version.metadata.sheets.length > 0 && (
                                      <span>{version.metadata.sheets.length} sheets</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.changesCell}>
                                {version.changeMetadata ? (
                                  <div className={styles.changeDetails}>
                                    {version.changeMetadata.addedRows > 0 && (
                                      <span className={styles.changeChip + ' ' + styles.added}>
                                        +{version.changeMetadata.addedRows} rows
                                      </span>
                                    )}
                                    {version.changeMetadata.modifiedRows > 0 && (
                                      <span className={styles.changeChip + ' ' + styles.modified}>
                                        ~{version.changeMetadata.modifiedRows} rows
                                      </span>
                                    )}
                                    {version.changeMetadata.removedRows > 0 && (
                                      <span className={styles.changeChip + ' ' + styles.removed}>
                                        -{version.changeMetadata.removedRows} rows
                                      </span>
                                    )}
                                    {version.changeMetadata.addedColumns && version.changeMetadata.addedColumns.length > 0 && (
                                      <div className={styles.columnChanges}>
                                        Added columns: {version.changeMetadata.addedColumns.join(', ')}
                                      </div>
                                    )}
                                    {version.changeMetadata.removedColumns && version.changeMetadata.removedColumns.length > 0 && (
                                      <div className={styles.columnChanges}>
                                        Removed columns: {version.changeMetadata.removedColumns.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className={styles.initialVersion}>Initial Version</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={styles.typeChip}>
                                {(version.type || 'CSV').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className={styles.dateCell}>
                                <span className={styles.dateText}>
                                  {new Date(version.createdAt || version.uploadedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span className={styles.timeText}>
                                  {new Date(version.createdAt || version.uploadedAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.actionsCell}>
                                <button 
                                  className={styles.actionButton + ' ' + styles.deleteButton}
                                  title="Delete version"
                                  disabled={datasetVersions.length <= 1}
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.versionEmpty}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className={styles.emptyIcon}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <h4>No Version History</h4>
                    <p>No dataset versions found for this workspace. Upload some files to start tracking version history.</p>
                  </div>
                )}
              </div>
              
              <div className={styles.versionModalFooter}>
                <button 
                  className={styles.versionModalButton}
                  onClick={() => setShowVersionHistory(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add the data validation error modal to the component JSX */}
      <AnimatePresence>
        {showDataValidationError && <DataValidationErrorModal />}
      </AnimatePresence>
      
      {/* Tax Optimization Modal */}
      <TaxOptimizationModal
        isOpen={showTaxOptimizationModal}
        result={taxOptimizationResult}
        fileName={fileName || undefined}
        onClose={handleTaxOptimizationModalClose}
        onExportReport={handleTaxOptimizationReportExport}
      />
      
      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <EmailModal 
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSubmit={handleEmailSubmit}
            sending={sending}
          />
        )}
      </AnimatePresence>
      
      {/* Existing notification */}
      <AnimatePresence>
        {notification.show && (
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={closeNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
}