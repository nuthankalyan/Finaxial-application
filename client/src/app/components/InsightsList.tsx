'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InsightsList.module.css';
import InsightsPanel from './InsightsPanel';
import VisualizationPanel from './VisualizationPanel';
import { FinancialInsights } from '../services/geminiService';
import InsightCards, { InsightCardData } from './InsightCards';

export interface SavedInsight {
  _id: string;
  fileName: string;
  summary: string;
  insights: string[] | string;
  recommendations: string[] | string;
  charts?: any;  // Add charts data
  rawResponse: string;
  createdAt: string;
  insightCards?: InsightCardData[];  // Add insightCards data
  assistantChat?: Array<{
    text: string;
    sender: string;
    timestamp: string;
  }>;
  notes?: string;  // Add notes field
}

interface InsightsListProps {
  savedInsights: SavedInsight[];
  currentInsight: FinancialInsights | null;
  currentFileName: string | null;
  currentCharts?: any;  // Add currentCharts prop
}

export default function InsightsList({ savedInsights, currentInsight, currentFileName, currentCharts }: InsightsListProps) {
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'visualizations'>('insights');
  
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
          charts: currentCharts || null,  // Use the charts from props
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
                  {/* Tabs for Insights and Visualizations */}
                  {insight.charts && Array.isArray(insight.charts) && insight.charts.length > 0 && (
                    <div className={styles.expandedTabs}>
                      <button 
                        className={`${styles.expandedTabButton} ${activeTab === 'insights' ? styles.activeExpandedTab : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('insights');
                        }}
                      >
                        Insights
                      </button>
                      <button 
                        className={`${styles.expandedTabButton} ${activeTab === 'visualizations' ? styles.activeExpandedTab : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('visualizations');
                        }}
                      >
                        Visualizations
                      </button>
                    </div>
                  )}
                  
                  <AnimatePresence mode="wait">
                    {activeTab === 'insights' && (
                      <motion.div
                        key="insights-panel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {/* Display insight cards if they exist */}
                        {insight.insightCards && insight.insightCards.length > 0 && (
                          <div className={styles.insightCardsContainer}>
                            <InsightCards cards={insight.insightCards} />
                          </div>
                        )}
                        
                        <InsightsPanel 
                          insights={{
                            summary: insight.summary,
                            insights: Array.isArray(insight.insights) ? insight.insights : typeof insight.insights === 'string' ? insight.insights.split('\n\n').filter(Boolean) : [],
                            recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : typeof insight.recommendations === 'string' ? insight.recommendations.split('\n\n').filter(Boolean) : [],
                            rawResponse: insight.rawResponse
                          }}
                          fileName={insight.fileName}
                          savedInsightCards={insight.insightCards}
                        />
                      </motion.div>
                    )}
                    
                    {activeTab === 'visualizations' && insight.charts && Array.isArray(insight.charts) && insight.charts.length > 0 && (
                      <motion.div
                        key="visualizations-panel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <VisualizationPanel 
                          charts={insight.charts} 
                          fileName={insight.fileName}
                          isLoading={false}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 