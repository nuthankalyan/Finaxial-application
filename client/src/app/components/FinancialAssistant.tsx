'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FinancialAssistant.module.css';
import { askFinancialQuestion } from '../services/geminiService';
import SqlCodeBlock from './SqlCodeBlock';
import { formatMessage } from '../utils/messageFormatter';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface FinancialAssistantProps {
  csvData: string | null;
  fileName: string | null;
  isEnabled: boolean;
  onMessagesChange?: (messages: Message[]) => void;
  initialMessages?: Message[];
}

const FinancialAssistant: React.FC<FinancialAssistantProps> = ({ csvData, fileName, isEnabled, onMessagesChange, initialMessages }) => {
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!inputValue.trim() || !csvData || isProcessing) return;
    
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
      
      // Get response from Gemini
      const response = await askFinancialQuestion(csvData, userMessage.text);
      
      // Remove typing indicator and add actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== typingId);
        return [...filtered, {
          id: generateMessageId(),
          text: response,
          sender: 'assistant',
          timestamp: new Date()
        }];
      });
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
        <h3>Financial Assistant</h3>
        {fileName && <span className={styles.datasetName}>Using data from: {fileName}</span>}
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
                  formatMessage(message.text, styles, setToastMessage, setShowToast, copyToClipboard)
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