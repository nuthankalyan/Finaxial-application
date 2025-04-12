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
import { analyzeCsvWithGemini, generateChartData, FinancialInsights, ChartData } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendPdfReportByEmail } from '../../services/emailService';
import { Chart as ChartJS, ChartTypeRegistry } from 'chart.js/auto';
import { buildApiUrl } from '../../utils/apiConfig';

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
  onSubmit: (email: string) => void;
  sending: boolean;
}

function EmailModal({ isOpen, onClose, onSubmit, sending }: EmailModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    onSubmit(email);
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

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
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
  const [detailsTab, setDetailsTab] = useState<'insights' | 'visualizations'>('insights');

  // Add new state for data validation popup
  const [showDataValidationError, setShowDataValidationError] = useState(false);

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
  };

  const handleFileUpload = async (csvContent: string, name: string) => {
    setFileName(name);
    
    // Check if the uploaded data is financial in nature
    if (!isFinancialData(csvContent)) {
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
    
    try {
      // First, analyze the data to get insights
      const results = await analyzeCsvWithGemini(csvContent);
      setInsights(results);
      
      // Generate chart data
      setGeneratingCharts(true);
      try {
        const chartData = await generateChartData(csvContent);
        
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
          rawResponse: insights.rawResponse
        }),
      });
      
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
        charts: data.data.charts || null
      };
      
      // Add the newly saved insight to the savedInsights state
      setSavedInsights(prevInsights => [savedInsight, ...prevInsights]);
      
      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        title: 'Insights Saved',
        message: 'Your financial analysis has been saved successfully.'
      });
      
      // Clear the current insights after saving
      setInsights(null);
      setFileName(null);
      setCharts(null);
      
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
    
    setFileName(insight.fileName);
    setActiveTab('summary');
    
    // Set the charts data if available
    if (insight.charts && Array.isArray(insight.charts)) {
      setCharts(insight.charts);
    } else {
      setCharts(null);
    }
    
    // Scroll to the content area when viewing saved insights
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add a new function to open the insight details modal
  const openInsightDetails = (insight: SavedInsight) => {
    setSelectedInsight(insight);
    setShowInsightDetails(true);
    // Default to insights tab, but switch to visualizations if there are no insights
    setDetailsTab('insights');
  };

  // Generate PDF function (will be reused for email)
  const generatePdf = (): jsPDF | null => {
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
      
      // Add summary section
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text('Summary', 15, 50);
      
      // Split summary into lines to fit page width
      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      const textLines = doc.splitTextToSize(insights.summary, 170);
      doc.text(textLines, 15, 60);
      
      const summaryEndY = Math.min(60 + textLines.length * 5, 260);
      
      // Add key insights section
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text('Key Insights', 15, summaryEndY + 10);
      
      // Format insights as a table
      const insightsData = Array.isArray(insights.insights) 
        ? insights.insights.map((insight, index) => [`${index + 1}.`, insight]) 
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
      
      const yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : summaryEndY + 130;
      doc.text('Recommendations', 15, yPosition);
      
      // Format recommendations as a table
      const recommendationsData = Array.isArray(insights.recommendations) 
        ? insights.recommendations.map((recommendation, index) => [`${index + 1}.`, recommendation]) 
        : [['', 'No recommendations available']];
      
      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 5,
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
      
      // Add visualizations section if charts are available
      if (charts && charts.length > 0) {
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
        charts.forEach((chart, index) => {
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
      
      return doc;
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(`Failed to generate PDF: ${err.message}`);
      setNotification({
        show: true,
        type: 'error',
        title: 'PDF Generation Failed',
        message: err.message || 'Failed to generate PDF report'
      });
      return null;
    }
  };

  const exportToPdf = async () => {
    if (!insights || !fileName) return;
    
    setExporting(true);
    
    try {
      const doc = generatePdf();
      if (doc) {
        // Save the PDF
        doc.save(`financial-insights-${fileName.replace(/\.[^/.]+$/, '')}.pdf`);
      }
    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      setError(`Failed to export as PDF: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };
  
  const sendEmailWithPdf = async (recipientEmail: string) => {
    if (!insights || !fileName) return;
    
    setSending(true);
    
    try {
      const doc = generatePdf();
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
    <div className={styles.container}>
      <div className={styles.workspaceLayout}>
        {/* Sidebar with history */}
        <motion.div 
          className={styles.sidebar}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className={styles.sidebarTitle}>History</h2>
          <div className={styles.previousInsights}>
            <h3>Previously generated insights</h3>
            {savedInsights.length > 0 ? (
              <div className={styles.insightsList}>
                {savedInsights.map((insight) => (
                  <motion.div 
                    key={insight._id}
                    className={styles.insightItem}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={styles.insightContent} onClick={() => handleViewInsight(insight)}>
                      <h4>{insight.fileName}</h4>
                      <p>{formatDate(insight.createdAt)}</p>
                    </div>
                    {insight.charts && Array.isArray(insight.charts) && insight.charts.length > 0 && (
                      <button 
                        className={styles.viewVisualizations}
                        onClick={(e) => {
                          e.stopPropagation();
                          openInsightDetails(insight);
                        }}
                        title="View Visualizations"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className={styles.visualizationIcon}
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="3" y1="9" x2="21" y2="9"></line>
                          <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                      </button>
                    )}
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
            
            <div className={styles.workspaceDate}>
              <p>Created: {workspace ? formatDate(workspace.createdAt) : '—'}</p>
              <p>Last updated: {workspace ? formatDate(workspace.updatedAt) : '—'}</p>
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
                onFileUpload={handleFileUpload} 
                isLoading={analyzing}
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
              </div>
            </div>

            {/* Tab content - using display property instead of conditional rendering to preserve state */}
            {insights && (
              <>
                <div className={styles.allTabContents}>
                  <div 
                    className={styles.tabContentWrapper} 
                    style={{ display: activeTab === 'summary' ? 'block' : 'none' }}
                  >
                    <div className={styles.summaryContent}>
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

                  {/* For transition effects, use an overlay that slides/fades */}
                  <motion.div 
                    className={styles.tabTransitionOverlay}
                    key={activeTab}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
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
                  
                  <motion.button
                    className={styles.exportButton}
                    onClick={exportToPdf}
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
                        Export PDF
                      </>
                    )}
                  </motion.button>
                  
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
                    </svg>
                    Send via Email
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
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
            >
              <div className={styles.modalHeader}>
                <h3>{selectedInsight.fileName}</h3>
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
                      <div className={styles.insightSummary}>
                        <h4>Summary</h4>
                        <p>{selectedInsight.summary}</p>
                      </div>
                      
                      <div className={styles.insightFindings}>
                        <h4>Key Insights</h4>
                        <ul>
                          {Array.isArray(selectedInsight.insights) 
                            ? selectedInsight.insights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                              ))
                            : typeof selectedInsight.insights === 'string'
                              ? selectedInsight.insights.split('\n\n').map((insight, index) => (
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
                            ? selectedInsight.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))
                            : typeof selectedInsight.recommendations === 'string'
                              ? selectedInsight.recommendations.split('\n\n').map((rec, index) => (
                                  <li key={index}>{rec}</li>
                                ))
                              : <li>No recommendations available</li>
                          }
                        </ul>
                      </div>
                    </motion.div>
                  )}
                  
                  {detailsTab === 'visualizations' && selectedInsight.charts && Array.isArray(selectedInsight.charts) && (
                    <motion.div
                      key="details-visualizations"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.visualizationsContainer}
                    >
                      <VisualizationHistory
                        charts={selectedInsight.charts}
                        fileName={selectedInsight.fileName}
                      />
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
                <button 
                  className={styles.modalViewButton}
                  onClick={() => {
                    handleViewInsight(selectedInsight);
                    setShowInsightDetails(false);
                  }}
                >
                  View in Main Area
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