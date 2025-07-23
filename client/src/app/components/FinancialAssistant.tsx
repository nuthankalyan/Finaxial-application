'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FinancialAssistant.module.css';
import { askFinancialQuestionCached, askFinancialQuestionWithVisualization, FileInfo } from '../services/geminiService';
import SqlCodeBlock from './SqlCodeBlock';
import { formatMessage } from '../utils/messageFormatter';
import { queryCache } from '../utils/cacheManager';
import { generateChatPDF } from '../utils/pdfGenerator';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  fromCache?: boolean;
  chartData?: any;
  tableData?: { headers: string[]; rows: any[][] };
}

interface FinancialAssistantProps {
  csvData: string | null;
  fileName: string | null;
  files?: FileInfo[]; // Add support for multiple files
  isEnabled: boolean;
  onMessagesChange?: (messages: Message[]) => void;
  initialMessages?: Message[];
}

const FinancialAssistant: React.FC<FinancialAssistantProps> = ({ csvData, fileName, files, isEnabled, onMessagesChange, initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
    ? initialMessages
    : [{
        id: '1',
        text: 'Hello! I\'m your financial assistant. Ask me anything about your uploaded financial data.',
        sender: 'assistant',
        timestamp: new Date()
      }]
  );
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Add toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Add state to track which SQL query is running
  const [runningSqlId, setRunningSqlId] = useState<string | null>(null);

  // Add state to track cache stats
  const [cacheStats, setCacheStats] = useState({ count: 0, sizeKB: 0 });

  // Suggested questions
  const suggestedQuestions = [
    "What are the key trends in this data?",
    "What's the average value in this dataset?",
    "Identify the highest and lowest points",
    "Explain the financial performance",
    "Calculate revenue growth rate"
  ];

  // SQL-specific suggested questions
  const sqlSuggestedQuestions = [
    "Write a SQL query to find the highest values",
    "Create a SQL query to calculate monthly averages",
    "SQL query to group and summarize this financial data",
    "Show me SQL to filter data by date range",
    "Generate SQL for financial trend analysis"
  ];

  // Determine which set of suggestions to show
  const [showSqlSuggestions, setShowSqlSuggestions] = useState(false);
  
  // Toggle between regular and SQL suggestions
  const toggleSuggestionType = () => {
    setShowSqlSuggestions(!showSqlSuggestions);
  };

  // Determine which suggestions to display
  const currentSuggestions = showSqlSuggestions ? sqlSuggestedQuestions : suggestedQuestions;

  // Add state to track visualizations for PDF export
  const [chartCanvases, setChartCanvases] = useState<HTMLCanvasElement[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Add effect to update cache stats periodically
  useEffect(() => {
    const updateCacheStats = () => {
      setCacheStats(queryCache.getStats());
    };
    
    // Update stats initially and on any storage change
    updateCacheStats();
    window.addEventListener('storage', updateCacheStats);
    
    // Set up a timer to update stats every minute
    const intervalId = setInterval(updateCacheStats, 60000);
    
    return () => {
      window.removeEventListener('storage', updateCacheStats);
      clearInterval(intervalId);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // When using multiple files, we'll use the files prop. Otherwise, fallback to the csvData prop
    const hasData = files ? files.length > 0 : !!csvData;
    
    if (!inputValue.trim() || !hasData || isProcessing) return;
    
    const userMessage: Message = {
      id: generateMessageId(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    try {
      // Show typing indicator
      const typingId = generateMessageId();
      setMessages(prev => [...prev, {
        id: typingId,
        text: '...',
        sender: 'assistant',
        timestamp: new Date()
      }]);
      
      // Track if response came from cache for UI indication
      let startTime = Date.now();
      let fromCache = false;
      
      let response: string;
      let chartData: any = null;
      let tableData: { headers: string[]; rows: any[][] } | undefined = undefined;
      
      // Check if user is asking for visualizations
      const userText = userMessage.text.toLowerCase();
      const isVisualizationRequest = userText.includes('chart') || userText.includes('graph') || 
                                   userText.includes('plot') || userText.includes('visualiz') ||
                                   userText.includes('show') || userText.includes('display');
      
      // Check if we're using multiple files (files prop) or single file (csvData prop)
      if (files && files.length > 0) {
        if (isVisualizationRequest) {
          // Use the enhanced service for visualization requests
          const result = await askFinancialQuestionWithVisualization(files[0].content, userMessage.text);
          response = result.response;
          chartData = result.chart;
          tableData = result.tableData;
        } else {
          // Use the cached service for regular questions
          response = await askFinancialQuestionCached(files[0].content, userMessage.text);
        }
      } else if (csvData) {
        if (isVisualizationRequest) {
          // Use the enhanced service for visualization requests
          const result = await askFinancialQuestionWithVisualization(csvData, userMessage.text);
          response = result.response;
          chartData = result.chart;
          tableData = result.tableData;
        } else {
          // Use the cached service for regular questions
          response = await askFinancialQuestionCached(csvData, userMessage.text);
        }
      } else {
        throw new Error('No data available');
      }
      
      // Check if response was returned too quickly (indicating cache hit)
      // We check for 300ms as a fast threshold that indicates a cache hit
      // This is a fallback in case the cache service doesn't properly set the fromCache flag
      fromCache = (Date.now() - startTime) < 300;
      
      // Update cache stats
      setCacheStats(queryCache.getStats());
      
      // Remove typing indicator and add actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== typingId);
        return [...filtered, {
          id: generateMessageId(),
          text: response,
          sender: 'assistant',
          timestamp: new Date(),
          fromCache,
          chartData,
          tableData
        }];
      });
      
      // If from cache, show a toast notification
      if (fromCache) {
        setToastMessage('Response loaded from cache');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.text !== '...');
        return [...filtered, {
          id: generateMessageId(),
          text: 'Sorry, I encountered an error analyzing your data. Please try asking a different question.',
          sender: 'assistant',
          timestamp: new Date()
        }];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Show toast notification
        setToastMessage('SQL copied to clipboard');
        setShowToast(true);
        
        // Hide toast after 2 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
        
        console.log('Text copied to clipboard');
      },
      (err) => {
        // Show error toast
        setToastMessage('Failed to copy to clipboard');
        setShowToast(true);
        
        // Hide toast after 2 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
        
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Helper function to simulate running an SQL query
  const simulateQueryExecution = (sqlQuery: string, queryId: string) => {
    // Set this query as running
    setRunningSqlId(queryId);
    
    // Show toast notification that query is running
    setToastMessage('Running SQL query...');
    setShowToast(true);
    
    // Simulate query execution time (1-2 seconds)
    const executionTime = 1000 + Math.random() * 1000;
    
    setTimeout(() => {
      // Query execution completed
      setRunningSqlId(null);
      setShowToast(false);
      
      // Show completion toast
      setTimeout(() => {
        setToastMessage('Query executed successfully');
        setShowToast(true);
        
        // Hide completion toast after 2 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      }, 100);
    }, executionTime);
  };

  // SQL keywords to highlight
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 
    'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN', 'ON', 'AS', 'DISTINCT', 'AND', 
    'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'CREATE TABLE', 
    'INSERT INTO', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'SET',
    'ASC', 'DESC', 'WITH', 'UNION', 'ALL', 'LIMIT', 'OFFSET'
  ];

  // SQL functions to highlight
  const sqlFunctions = [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'CAST', 'COALESCE', 
    'CONCAT', 'SUBSTRING', 'LENGTH', 'UPPER', 'LOWER', 'TRIM', 'DATE', 
    'TO_CHAR', 'TO_DATE', 'EXTRACT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
  ];
  
  // Extract SQL code from content
  const extractSqlQuery = (content: string): string | null => {
    const sqlRegex = /```sql([\s\S]*?)```/gi;
    const match = sqlRegex.exec(content);
    return match ? match[1].trim() : null;
  };

  // Helper function to clear the cache
  const clearCache = () => {
    queryCache.clear();
    setCacheStats({ count: 0, sizeKB: 0 });
    setToastMessage('Cache cleared successfully');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Add function to export chat history to PDF
  const exportChatToPDF = async () => {
    if (messages.length <= 1) {
      setToastMessage('No conversation to export');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    
    setIsExportingPDF(true);
    setToastMessage('Preparing PDF export...');
    setShowToast(true);
    
    try {
      // Collect all chart canvases from the DOM with a more specific selector
      const chartContainers = document.querySelectorAll('.chart-canvas');
      const chartCanvases: HTMLCanvasElement[] = [];
      
      chartContainers.forEach(container => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          chartCanvases.push(canvas);
        }
      });
      
      // Alternative approach: look for canvases in chart containers
      if (chartCanvases.length === 0) {
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(canvas => {
          // Check if the canvas is within a chart visualization container
          const chartContainer = canvas.closest('[class*="chartContainer"]');
          if (chartContainer) {
            chartCanvases.push(canvas);
          }
        });
      }
      
      console.log(`Found ${chartCanvases.length} chart canvases for PDF export`);
      
      // Filter messages with chart and table data
      const messagesWithData = messages.map(msg => ({
        ...msg,
        hasVisualization: !!(msg.chartData || msg.tableData)
      }));
      
      // Generate the PDF with visualizations and tables
      await generateChatPDF(
        messagesWithData, 
        chartCanvases.length > 0 ? chartCanvases : undefined,
        fileName || undefined,
        { 
          includeCharts: chartCanvases.length > 0,
          includeTimestamp: true,
          title: 'Financial Analysis Report'
        }
      );
      
      setToastMessage('Chat history exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setToastMessage('Failed to export chat history');
    } finally {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsExportingPDF(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className={styles.disabledContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={styles.disabledIcon}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h3>Financial Assistant</h3>
        <p>Upload financial data to start a conversation with the AI assistant.</p>
      </div>
    );
  }

  if (!csvData) {
    return (
      <div className={styles.disabledContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={styles.disabledIcon}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h3>Financial Assistant</h3>
        <p>Upload financial data to start a conversation with the AI assistant.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3>Financial Assistant</h3>
          
          <div className={styles.headerActions}>
            {messages.length > 1 && (
              <button
                className={styles.exportButton}
                onClick={exportChatToPDF}
                disabled={isExportingPDF}
                title="Export conversation to PDF"
              >
                {isExportingPDF ? (
                  <div className={styles.buttonSpinner}></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                )}
                <span>Export Chat PDF</span>
              </button>
            )}
          </div>
        </div>
        
        {fileName && <span className={styles.datasetName}>Using data from: {fileName}</span>}
        
        {/* Add cache stats display */}
        {cacheStats.count > 0 && (
          <div className={styles.cacheStats}>
            <span title="Number of cached responses">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              {cacheStats.count} cached
            </span>
            <button 
              className={styles.clearCacheBtn} 
              onClick={clearCache}
              title="Clear response cache"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className={styles.messagesContainer}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.assistantMessage}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.messageContent}>
                {message.text === '...' ? (
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : message.sender === 'assistant' ? (
                  <>
                    {formatMessage(message.text, styles, setToastMessage, setShowToast, copyToClipboard, message.chartData, message.tableData)}
                    {message.fromCache && (
                      <div className={styles.cacheIndicator} title="Response loaded from cache">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Cached</span>
                      </div>
                    )}
                  </>
                ) : (
                  message.text
                )}
              </div>
              <div className={styles.messageTime}>
                {message.text !== '...' && message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            className={styles.toast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Only show suggested questions if there are no user messages yet */}
      {!messages.some(message => message.sender === 'user') && (
        <div className={styles.suggestedQuestions}>
          <div className={styles.suggestedQuestionsHeader}>
          <p>Suggested questions:</p>
            <button
              className={styles.suggestionTypeToggle}
              onClick={toggleSuggestionType}
              title={showSqlSuggestions ? "Show regular questions" : "Show SQL questions"}
            >
              {showSqlSuggestions ? "Regular Questions" : "SQL Queries"}
            </button>
          </div>
          <div className={styles.questionButtons}>
            {currentSuggestions.map((question, index) => (
              <button
                key={index}
                className={styles.questionButton}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isProcessing}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your financial data..."
          disabled={isProcessing || !csvData}
          className={styles.input}
          ref={inputRef}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={isProcessing || !inputValue.trim() || !csvData}
        >
          {isProcessing ? (
            <div className={styles.buttonSpinner}></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default FinancialAssistant;