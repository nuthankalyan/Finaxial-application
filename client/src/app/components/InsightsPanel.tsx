'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FinancialInsights } from '../services/geminiService';
import styles from './InsightsPanel.module.css';
import InsightCards, { InsightCardData } from './InsightCards';
import { cleanText, cleanTextArray } from '../utils/textCleaner';

interface InsightsPanelProps {
  insights: FinancialInsights | null;
  fileName: string | null;
  savedInsightCards?: InsightCardData[];
}

export default function InsightsPanel({ insights, fileName, savedInsightCards }: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'insights' | 'recommendations'>('summary');

  if (!insights) {
    return null;
  }

  // Format insights and recommendations for display with asterisk removal
  const formatInsights = (data: string[] | string): string => {
    if (Array.isArray(data)) {
      return cleanTextArray(data).map(item => `- ${item}`).join('\n\n');
    }
    return cleanText(data);
  };

  const tabVariants = {
    inactive: { opacity: 0.6, y: 0 },
    active: { opacity: 1, y: 0, color: '#2563eb' },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  // Get numerical insights from the data
  const getNumericalInsights = (): InsightCardData[] => {
    // If saved insight cards are provided, use them
    if (savedInsightCards && savedInsightCards.length > 0) {
      return savedInsightCards;
    }
    
    // Otherwise, generate from the insights data
    if (!insights.numericalInsights || !insights.numericalInsights.metrics || insights.numericalInsights.metrics.length === 0) {
      // If no metrics are available, return an empty array
      return [];
    }
    
    // Map the metrics to the format required by InsightCards
    return insights.numericalInsights.metrics.map(metric => ({
      value: metric.value,
      label: metric.label,
      change: metric.change
    }));
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className={styles.header}>
        <motion.h3 
          className={styles.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >          AI Financial Insights
          {fileName && <span className={styles.fileName}>
            {fileName.includes('files selected') ? fileName : `for ${fileName}`}
            {insights && insights.fileNames && insights.fileNames.length > 1 && (
              <span className={styles.multiFileBadge}>{insights.fileNames.length} files analyzed</span>
            )}
          </span>}
        </motion.h3>
      </div>

      <div className={styles.tabs}>
        <motion.button
          className={`${styles.tab} ${activeTab === 'summary' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('summary')}
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === 'summary' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Summary
          {activeTab === 'summary' && (
            <motion.div 
              className={styles.activeIndicator}
              layoutId="activeIndicator"
            />
          )}
        </motion.button>
        
        <motion.button
          className={`${styles.tab} ${activeTab === 'insights' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('insights')}
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === 'insights' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Key Insights
          {activeTab === 'insights' && (
            <motion.div 
              className={styles.activeIndicator}
              layoutId="activeIndicator"
            />
          )}
        </motion.button>
        
        <motion.button
          className={`${styles.tab} ${activeTab === 'recommendations' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('recommendations')}
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === 'recommendations' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Recommendations
          {activeTab === 'recommendations' && (
            <motion.div 
              className={styles.activeIndicator}
              layoutId="activeIndicator"
            />
          )}
        </motion.button>
      </div>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={styles.tabContent}
            >
              {/* Numerical Insight Cards */}
              <InsightCards cards={getNumericalInsights()} />
              
              <div className={styles.iconContainer}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
              </div>
              <div className={styles.markdownContainer}>
                <ReactMarkdown>{cleanText(insights.summary)}</ReactMarkdown>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={styles.tabContent}
            >
              <div className={styles.iconContainer}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div className={styles.markdownContainer}>
                <ReactMarkdown>{formatInsights(insights.insights)}</ReactMarkdown>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={styles.tabContent}
            >
              <div className={styles.iconContainer}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <div className={styles.markdownContainer}>
                <ReactMarkdown>{formatInsights(insights.recommendations)}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 