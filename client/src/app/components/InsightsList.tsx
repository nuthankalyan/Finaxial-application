'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InsightsList.module.css';
import InsightsPanel from './InsightsPanel';
import { FinancialInsights } from '../services/geminiService';

export interface SavedInsight {
  _id: string;
  fileName: string;
  summary: string;
  insights: string;
  recommendations: string;
  rawResponse: string;
  createdAt: string;
}

interface InsightsListProps {
  savedInsights: SavedInsight[];
  currentInsight: FinancialInsights | null;
  currentFileName: string | null;
}

export default function InsightsList({ savedInsights, currentInsight, currentFileName }: InsightsListProps) {
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert current insight to the same format as saved insights for display
  const allInsights = currentInsight
    ? [
        // Current insight at the top if it exists
        {
          _id: 'current',
          fileName: currentFileName || 'Current Analysis',
          summary: currentInsight.summary,
          insights: currentInsight.insights,
          recommendations: currentInsight.recommendations,
          rawResponse: currentInsight.rawResponse,
          createdAt: new Date().toISOString(),
        },
        // Then all previously saved insights
        ...savedInsights
      ]
    : savedInsights;
    
  if (allInsights.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Financial Insights History</h2>
      
      <AnimatePresence>
        {allInsights.map((insight, index) => (
          <motion.div
            key={insight._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={styles.insightItem}
          >
            <div 
              className={styles.insightHeader}
              onClick={() => setExpandedInsightId(expandedInsightId === insight._id ? null : insight._id)}
            >
              <div className={styles.insightMeta}>
                <h3 className={styles.fileName}>
                  {insight._id === 'current' && <span className={styles.currentBadge}>Current</span>}
                  {insight.fileName}
                </h3>
                <span className={styles.date}>{formatDate(insight.createdAt)}</span>
              </div>
              <button className={styles.expandButton}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`${styles.icon} ${expandedInsightId === insight._id ? styles.expanded : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            
            <AnimatePresence>
              {expandedInsightId === insight._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={styles.expandedContent}
                >
                  <InsightsPanel 
                    insights={{
                      summary: insight.summary,
                      insights: insight.insights,
                      recommendations: insight.recommendations,
                      rawResponse: insight.rawResponse
                    }}
                    fileName={insight.fileName}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 