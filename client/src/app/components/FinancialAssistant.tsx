'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FinancialAssistant.module.css';
import { askFinancialQuestion } from '../services/geminiService';

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
}

const FinancialAssistant: React.FC<FinancialAssistantProps> = ({ csvData, fileName, isEnabled, onMessagesChange }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your financial assistant. Ask me anything about your uploaded financial data.',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggested questions
  const suggestedQuestions = [
    "What are the key trends in this data?",
    "What's the average value in this dataset?",
    "Identify the highest and lowest points",
    "Explain the financial performance",
    "Calculate revenue growth rate"
  ];

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

  const formatMessage = (text: string): React.ReactNode => {
    if (!text || text === '...') return text;

    // Function to convert asterisk/dash lists to properly formatted HTML lists
    const formatLists = (content: string): React.ReactNode[] => {
      const lines = content.split('\n');
      const result: React.ReactNode[] = [];
      let inList = false;
      let listItems: string[] = [];
      let listType: 'ul' | 'ol' = 'ul';
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Check if this is a list item (starts with -, *, •, or 1., 2., etc.)
        const isUnorderedListItem = /^[-*•]/.test(trimmedLine);
        const isOrderedListItem = /^\d+\./.test(trimmedLine);
        
        if (isUnorderedListItem || isOrderedListItem) {
          // Start a new list if we're not in one
          if (!inList) {
            inList = true;
            listType = isUnorderedListItem ? 'ul' : 'ol';
          }
          
          // Add the content after the list marker
          const content = trimmedLine.replace(/^[-*•]\s*|\d+\.\s*/, '');
          listItems.push(content);
        } else {
          // If we were in a list and now we're not, add the list to results
          if (inList) {
            result.push(
              listType === 'ul' 
                ? <ul key={`ul-${index}`} className={styles.messageList}>{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>
                : <ol key={`ol-${index}`} className={styles.messageList}>{listItems.map((item, i) => <li key={i}>{item}</li>)}</ol>
            );
            listItems = [];
            inList = false;
          }
          
          // Add non-list line as paragraph (if not empty)
          if (trimmedLine) {
            // Check if it's a header (starts with # or ##)
            if (/^#{1,3}\s/.test(trimmedLine)) {
              const headerContent = trimmedLine.replace(/^#{1,3}\s/, '');
              result.push(<h4 key={index} className={styles.messageHeader}>{headerContent}</h4>);
            } else {
              result.push(<p key={index} className={styles.messageParagraph}>{trimmedLine}</p>);
            }
          } else if (index > 0 && index < lines.length - 1 && lines[index-1].trim() && lines[index+1].trim()) {
            // Add space between paragraphs (only if there's content before and after)
            result.push(<div key={`space-${index}`} className={styles.messageSpace} />);
          }
        }
      });
      
      // If we end with a list, make sure to add it
      if (inList) {
        result.push(
          listType === 'ul' 
            ? <ul className={styles.messageList}>{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>
            : <ol className={styles.messageList}>{listItems.map((item, i) => <li key={i}>{item}</li>)}</ol>
        );
      }
      
      return result;
    };

    // Handle tables (if present)
    if (text.includes('|') && text.includes('\n')) {
      // Try to detect if there's a table in the text
      const lines = text.split('\n');
      const tableStartIndex = lines.findIndex(line => line.includes('|') && line.includes('-'));
      
      if (tableStartIndex > 0) {
        // There's likely a table - handle everything before it normally
        const beforeTable = lines.slice(0, tableStartIndex - 1).join('\n');
        const tableSection = lines.slice(tableStartIndex - 1);
        
        // Process the table
        const tableRows = [];
        let inTable = false;
        let headers: string[] = [];
        
        for (let i = 0; i < tableSection.length; i++) {
          const line = tableSection[i].trim();
          
          if (line.includes('|')) {
            if (!inTable) {
              // This is the header row
              headers = line.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell);
              inTable = true;
            } else if (line.includes('-')) {
              // This is the separator row, skip it
              continue;
            } else {
              // This is a data row
              const cells = line.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell);
              
              if (cells.length > 0) {
                tableRows.push(cells);
              }
            }
          }
        }
        
        // Only proceed with table if we have headers and rows
        if (headers.length > 0 && tableRows.length > 0) {
          return (
            <>
              {formatLists(beforeTable)}
              <div className={styles.messageTableContainer}>
                <table className={styles.messageTable}>
                  <thead>
                    <tr>
                      {headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        }
      }
    }
    
    // Format code blocks
    if (text.includes('```')) {
      const parts = text.split(/```([^`]*?)```/g);
      const result: React.ReactNode[] = [];
      
      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          // This is regular text, format it normally
          result.push(...formatLists(part));
        } else {
          // This is a code block
          result.push(
            <pre key={`code-${index}`} className={styles.messageCode}>
              <code>{part}</code>
            </pre>
          );
        }
      });
      
      return <>{result}</>;
    }
    
    // Default formatting for text without tables or code blocks
    return <>{formatLists(text)}</>;
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
                  formatMessage(message.text)
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

      {/* Only show suggested questions if there are no user messages yet */}
      {!messages.some(message => message.sender === 'user') && (
        <div className={styles.suggestedQuestions}>
          <p>Suggested questions:</p>
          <div className={styles.questionButtons}>
            {suggestedQuestions.map((question, index) => (
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