'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './workspace.module.css';
import CsvUploader from '../../components/CsvUploader';
import InsightsPanel from '../../components/InsightsPanel';
import InsightsList, { SavedInsight } from '../../components/InsightsList';
import { analyzeCsvWithGemini, FinancialInsights } from '../../services/geminiService';

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
        const response = await fetch(`http://localhost:5000/api/workspaces/${id}`, {
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

  const handleFileUpload = async (csvContent: string, name: string) => {
    setFileName(name);
    setAnalyzing(true);
    setInsights(null);
    
    try {
      const results = await analyzeCsvWithGemini(csvContent);
      setInsights(results);
    } catch (err: any) {
      setError(`Analysis failed: ${err.message}`);
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
      const response = await fetch(`http://localhost:5000/api/workspaces/${id}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName,
          summary: insights.summary,
          insights: insights.insights,
          recommendations: insights.recommendations,
          rawResponse: insights.rawResponse
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save insights');
      }
      
      const data = await response.json();
      
      // Add the newly saved insight to the savedInsights state
      setSavedInsights(prevInsights => [data.data, ...prevInsights]);
      
      // Clear the current insights after saving
      setInsights(null);
      setFileName(null);
      
    } catch (err: any) {
      setError(`Failed to save insights: ${err.message}`);
    } finally {
      setSaving(false);
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
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard">
          <button className={styles.backButton}>
            &larr; Back to Dashboard
          </button>
        </Link>
      </div>

      {workspace && (
        <div className={styles.workspaceInfo}>
          <h1>{workspace.name}</h1>
          <p className={styles.workspaceDescription}>{workspace.description}</p>
          <div className={styles.workspaceDetails}>
            <span>Created: {formatDate(workspace.createdAt)}</span>
            <span>Last updated: {formatDate(workspace.updatedAt)}</span>
          </div>
        </div>
      )}

      <div className={styles.dataSection}>
        <h2 className={styles.sectionHeader}>Upload Financial Data</h2>
        <p className={styles.sectionDescription}>
          Upload your CSV file with financial data to get AI-powered insights. We accept standard CSV formats.
        </p>
        
        <CsvUploader 
          onFileUpload={handleFileUpload} 
          isLoading={analyzing}
        />
      </div>

      {analyzing && (
        <div className={styles.analyzingState}>
          <div className={styles.spinner}></div>
          <p>Analyzing your financial data...</p>
        </div>
      )}

      {insights && (
        <div className={styles.insightsSection}>
          <InsightsPanel 
            insights={insights}
            fileName={fileName}
          />
          
          <div className={styles.saveContainer}>
            <button 
              className={styles.primaryButton}
              onClick={saveInsightsToDatabase}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Insights
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!insights && !analyzing && savedInsights.length === 0 && (
        <div className={styles.placeholderSection}>
          <h3>Your financial insights will appear here</h3>
          <p>Upload a CSV file to get started</p>
        </div>
      )}
      
      {/* Display saved insights and current insight if any */}
      {(savedInsights.length > 0 || insights) && (
        <InsightsList 
          savedInsights={savedInsights}
          currentInsight={insights}
          currentFileName={fileName}
        />
      )}
    </div>
  );
} 