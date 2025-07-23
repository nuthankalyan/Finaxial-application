'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './report.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TableRow, TableColumn } from '@/app/types/tables';
import type { SummaryTable } from '@/app/types/csv';
import { generateSummaryTables, generateMultiFileSummaryTables, generateSummaryTablesEnhanced, generateMultiFileSummaryTablesEnhanced, type ReportData } from '@/app/services/summaryTableService';
import { buildApiUrl } from '../../../../utils/apiConfig';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Chart } from 'chart.js/auto';
import EmailReportModal from '@/app/components/EmailReportModal';
import { cleanText, cleanTextArray } from '../../../../utils/textCleaner';

interface ReportPageProps {
  params: {
    id: string;
    report_id: string;
  };
}

interface TabItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  tableRefs: string[];
}

interface WorkspaceData {
  _id: string;
  name: string;
  datasets?: Array<{
    id: string;
    name: string;
    versions: Array<{
      id: string;
      content: string;
      fileName: string;
      type: 'csv' | 'excel';
      createdAt: string;
    }>;
  }>;
}

interface DetailedTableAnalysis {
  businessContext: string;
  keyTrends: string[];
  financialImplications: string;
  riskFactors: string[];
  opportunities: string[];
  recommendations: string[];
  industryBenchmark: string;
  forecastInsights: string;
}

interface EnhancedReportData extends ReportData {
  detailedAnalysis?: {
    [tableId: string]: DetailedTableAnalysis;
  };
}

const ReportPage: React.FC<ReportPageProps> = ({ params }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [reportData, setReportData] = useState<EnhancedReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportName, setReportName] = useState<string>('Financial Report');
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Function to generate detailed analysis for a table
  const generateDetailedTableAnalysis = async (
    table: SummaryTable,
    csvContent: string,
    fileName: string
  ): Promise<DetailedTableAnalysis> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_5;
      
      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Convert table data to a readable format for analysis
      const tableDataString = table.data.map(row => 
        Object.entries(row)
          .filter(([key]) => key !== 'isTotal' && key !== 'isSubTotal' && key !== 'isHeader')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      ).join('\n');

      const prompt = `
You are a senior financial analyst preparing a detailed analysis for a financial table in an annual report. Analyze the following financial table and provide comprehensive insights.

TABLE INFORMATION:
Title: ${table.title}
Description: ${table.description}
Columns: ${table.columns.map(col => col.header).join(', ')}

TABLE DATA:
${tableDataString}

ORIGINAL CSV DATA:
${csvContent}

FILE NAME: ${fileName}

Please provide a detailed financial analysis with the following sections:

1. BUSINESS CONTEXT: Explain what this table represents in the context of financial reporting and business operations. Use professional financial terminology.

2. KEY TRENDS: Identify 3-5 important trends or patterns in the data. Focus on significant changes, growth patterns, or anomalies.

3. FINANCIAL IMPLICATIONS: Explain what this data means for the business's financial health, performance, and strategic position.

4. RISK FACTORS: Identify 2-4 potential risks or concerns based on this data analysis.

5. OPPORTUNITIES: Identify 2-4 potential opportunities or positive indicators from this data.

6. RECOMMENDATIONS: Provide 3-5 specific, actionable recommendations based on this analysis.

7. INDUSTRY BENCHMARK: Compare this data to industry standards or benchmarks where applicable.

8. FORECAST INSIGHTS: Provide forward-looking insights and projections based on the current data trends.

CRITICAL FORMATTING REQUIREMENTS:
- Write in PLAIN TEXT only - no markdown, no formatting symbols
- NEVER use asterisks (*) or any special characters for emphasis
- NEVER use double asterisks (**) for bold text
- Use only regular sentences and paragraphs
- For lists, use simple numbered points or write as sentences
- Write professionally without any formatting markup

Format your response exactly as follows (use plain text only):

BUSINESS CONTEXT:
Write your business context analysis here in plain sentences without any formatting symbols.

KEY TRENDS:
Write trend 1 as a complete sentence.
Write trend 2 as a complete sentence.
Write trend 3 as a complete sentence.

FINANCIAL IMPLICATIONS:
Write your financial implications analysis here in plain sentences without any formatting symbols.

RISK FACTORS:
Write risk 1 as a complete sentence.
Write risk 2 as a complete sentence.

OPPORTUNITIES:
Write opportunity 1 as a complete sentence.
Write opportunity 2 as a complete sentence.

RECOMMENDATIONS:
Write recommendation 1 as a complete sentence.
Write recommendation 2 as a complete sentence.
Write recommendation 3 as a complete sentence.

INDUSTRY BENCHMARK:
Write your industry benchmark analysis here in plain sentences without any formatting symbols.

FORECAST INSIGHTS:
Write your forecast insights here in plain sentences without any formatting symbols.

Remember: Use ONLY plain text. NO asterisks, NO bold formatting, NO markdown. Write as if you are writing a formal business document.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to extract different sections
      const businessContextMatch = text.match(/BUSINESS CONTEXT:([\s\S]*?)(?=KEY TRENDS:|$)/i);
      const keyTrendsMatch = text.match(/KEY TRENDS:([\s\S]*?)(?=FINANCIAL IMPLICATIONS:|$)/i);
      const financialImplicationsMatch = text.match(/FINANCIAL IMPLICATIONS:([\s\S]*?)(?=RISK FACTORS:|$)/i);
      const riskFactorsMatch = text.match(/RISK FACTORS:([\s\S]*?)(?=OPPORTUNITIES:|$)/i);
      const opportunitiesMatch = text.match(/OPPORTUNITIES:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
      const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=INDUSTRY BENCHMARK:|$)/i);
      const industryBenchmarkMatch = text.match(/INDUSTRY BENCHMARK:([\s\S]*?)(?=FORECAST INSIGHTS:|$)/i);
      const forecastInsightsMatch = text.match(/FORECAST INSIGHTS:([\s\S]*?)(?=$)/i);

      // Helper function to clean text content
      const cleanText = (text: string): string => {
        return text
          .replace(/\*+/g, '') // Remove all asterisks
          .replace(/#+\s*/g, '') // Remove markdown headers
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/^\s*[-•]\s*/, '') // Remove leading bullet points
          .trim();
      };

      const businessContext = businessContextMatch ? 
        cleanText(businessContextMatch[1]) : 
        'This table provides important financial metrics for business analysis.';
      
      const keyTrends = keyTrendsMatch ? 
        keyTrendsMatch[1]
          .split(/\n/)
          .map(item => cleanText(item))
          .filter(item => item.length > 0 && !item.toLowerCase().includes('trend') && !item.toLowerCase().includes('write'))
          .slice(0, 5) : 
        ['Data analysis reveals important patterns and trends.'];
      
      const financialImplications = financialImplicationsMatch ? 
        cleanText(financialImplicationsMatch[1]) : 
        'The data indicates important financial implications for business strategy.';
      
      const riskFactors = riskFactorsMatch ? 
        riskFactorsMatch[1]
          .split(/\n/)
          .map(item => cleanText(item))
          .filter(item => item.length > 0 && !item.toLowerCase().includes('risk') && !item.toLowerCase().includes('write'))
          .slice(0, 4) : 
        ['Consider potential risks in financial planning.'];
      
      const opportunities = opportunitiesMatch ? 
        opportunitiesMatch[1]
          .split(/\n/)
          .map(item => cleanText(item))
          .filter(item => item.length > 0 && !item.toLowerCase().includes('opportunity') && !item.toLowerCase().includes('write'))
          .slice(0, 4) : 
        ['Identify growth opportunities in the data.'];
      
      const recommendations = recommendationsMatch ? 
        recommendationsMatch[1]
          .split(/\n/)
          .map(item => cleanText(item))
          .filter(item => item.length > 0 && !item.toLowerCase().includes('recommendation') && !item.toLowerCase().includes('write'))
          .slice(0, 5) : 
        ['Develop strategic recommendations based on analysis.'];
      
      const industryBenchmark = industryBenchmarkMatch ? 
        cleanText(industryBenchmarkMatch[1]) : 
        'Compare performance against industry standards and benchmarks.';
      
      const forecastInsights = forecastInsightsMatch ? 
        cleanText(forecastInsightsMatch[1]) : 
        'Project future trends and performance based on current data.';

      return {
        businessContext,
        keyTrends,
        financialImplications,
        riskFactors,
        opportunities,
        recommendations,
        industryBenchmark,
        forecastInsights
      };
    } catch (error: any) {
      console.error('Error generating detailed table analysis:', error);
      return {
        businessContext: 'This table provides important financial metrics for business analysis.',
        keyTrends: ['Data analysis reveals important patterns and trends.'],
        financialImplications: 'The data indicates important financial implications for business strategy.',
        riskFactors: ['Consider potential risks in financial planning.'],
        opportunities: ['Identify growth opportunities in the data.'],
        recommendations: ['Develop strategic recommendations based on analysis.'],
        industryBenchmark: 'Compare performance against industry standards and benchmarks.',
        forecastInsights: 'Project future trends and performance based on current data.'
      };
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch workspace data to get datasets
        const response = await fetch(buildApiUrl(`api/workspaces/${params.id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch workspace data');
        }

        const { data: workspace } = await response.json();
        setWorkspaceData(workspace);
        setReportName(`${workspace.name} - Financial Report`);

        // REPORT PERSISTENCE LOGIC:
        // 1. First check if a report already exists for this report_id
        // 2. If exists, use the saved report data (maintains consistency)
        // 3. If not exists, generate new report using session data or current dataset versions
        // 4. Save the new report with dataset version information for future consistency
        
        // First, try to fetch existing report data for this specific report_id
        let existingReportData: EnhancedReportData | null = null;
        let sessionData: any = null;
        
        try {
          const token = localStorage.getItem('token');
          const reportResponse = await fetch(buildApiUrl(`api/workspaces/${params.id}/report/${params.report_id}`), {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (reportResponse.ok) {
            const { data: reportData } = await reportResponse.json();
            if (reportData) {
              // Check if this is already processed report data
              if (reportData.reportData) {
                existingReportData = reportData.reportData;
                setReportData(existingReportData);
                setIsLoading(false);
                return; // Use existing report data, no need to regenerate
              }
              
              // This is session data that needs to be processed
              sessionData = reportData;
            }
          }
        } catch (fetchError) {
          console.log('No existing report found, will generate new one using workspace data');
        }

        let csvFiles: { content: string; fileName: string }[] = [];
        let useSessionDataOnly = false;

        // Use session data if available, otherwise fall back to workspace datasets
        if (sessionData) {
          console.log('[Report] Session data found:', {
            hasUploadedFiles: !!sessionData.uploadedFiles,
            isFromSavedInsight: !!sessionData.isFromSavedInsight,
            uploadedFilesCount: sessionData.uploadedFiles ? sessionData.uploadedFiles.length : 0
          });

          if (sessionData.isFromSavedInsight && sessionData.savedInsightData) {
            // This report is generated from a saved insight - we don't have the raw CSV data
            // We'll need to create a simplified report based on the insight data
            const savedInsight = sessionData.savedInsightData;
            
            // Create a simplified report data structure
            const simplifiedReportData: EnhancedReportData = {
              summary: savedInsight.summary,
              insights: Array.isArray(savedInsight.insights) ? savedInsight.insights : [savedInsight.insights],
              recommendations: Array.isArray(savedInsight.recommendations) ? savedInsight.recommendations : [savedInsight.recommendations],
              tables: [], // No tables for saved insights
              detailedAnalysis: {}
            };
            
            setReportData(simplifiedReportData);
            setIsLoading(false);
            return;
          } else if (sessionData.uploadedFiles && sessionData.uploadedFiles.length > 0) {
            // Use the uploaded files from the current session
            csvFiles = sessionData.uploadedFiles;
            useSessionDataOnly = true;
            console.log('[Report] Using session uploaded files:', csvFiles.length, 'files');
            console.log('[Report] Session files details:', csvFiles.map(f => ({ 
              fileName: f.fileName, 
              contentLength: f.content.length,
              contentPreview: f.content.substring(0, 100) + '...'
            })));
          } else {
            console.warn('[Report] Session data exists but no uploadedFiles found:', sessionData);
          }
        }
        
        // Fall back to workspace datasets ONLY if no session data is available
        if (!useSessionDataOnly && csvFiles.length === 0) {
          console.log('[Report] No session data found, falling back to workspace datasets');
          
          // Check if workspace has datasets with data
          if (!workspace.datasets || workspace.datasets.length === 0) {
            setError('No datasets found in this workspace. Please upload financial data first.');
            return;
          }

          // Get the latest version of each dataset (snapshot at report creation time)
          const currentDatasets = workspace.datasets.map((dataset: any) => {
            const latestVersion = dataset.versions[dataset.versions.length - 1];
            return {
              content: latestVersion.content,
              fileName: latestVersion.fileName,
              type: latestVersion.type,
              datasetId: dataset.id,
              versionId: latestVersion.id,
              createdAt: latestVersion.createdAt
            };
          });

          // Process content (keep Excel data as JSON, CSV as text)
          csvFiles = currentDatasets.map((dataset: any) => {
            return {
              content: dataset.content, // Keep original content format
              fileName: dataset.fileName,
              type: dataset.type // Pass the type information
            };
          });
        } else {
          // Keep original content format for session files
          csvFiles = csvFiles.map((dataset: any) => {
            return {
              content: dataset.content, // Keep original content (Excel as JSON, CSV as text)
              fileName: dataset.fileName,
              type: dataset.type // Preserve type information if available
            };
          });
        }        
        // Check if we have any data to process
        if (csvFiles.length === 0) {
          console.error('[Report] No data available to generate report');
          
          if (useSessionDataOnly) {
            setError('No session data available to generate this report. Please upload files first and try generating the report again.');
          } else {
            setError('No data available to generate this report. The session data may have been lost or expired.');
          }
          setIsLoading(false);
          return;
        }

        // Final validation: If we're supposed to use session data only, make sure we don't accidentally use workspace data
        if (useSessionDataOnly && sessionData && sessionData.uploadedFiles) {
          console.log('[Report] FINAL CHECK: Using ONLY session data, ignoring any workspace datasets');
        } else if (!useSessionDataOnly) {
          console.log('[Report] FINAL CHECK: No session data available, using workspace datasets as fallback');
        }

        console.log('[Report] Processing data with', csvFiles.length, 'files:', 
          csvFiles.map(f => ({ fileName: f.fileName, contentLength: f.content.length })));

        // Generate summary tables using enhanced Gemini AI functions
        let reportData: ReportData;
        
        if (csvFiles.length === 1) {
          // Use enhanced function that detects file type (CSV vs Excel with multiple sheets)
          reportData = await generateSummaryTablesEnhanced(csvFiles[0].content, csvFiles[0].fileName);
        } else {
          // Use enhanced multi-file function that handles mixed CSV and Excel files
          reportData = await generateMultiFileSummaryTablesEnhanced(csvFiles);
        }
        
        // Generate detailed analysis for each table
        const detailedAnalysis: { [tableId: string]: DetailedTableAnalysis } = {};
        
        try {
          // Generate detailed analysis for each table
          for (const table of reportData.tables) {
            const csvContent = csvFiles.length === 1 ? csvFiles[0].content : csvFiles.map((f: { content: string; fileName: string }) => f.content).join('\n\n');
            const fileName = csvFiles.length === 1 ? csvFiles[0].fileName : 'Multiple Files';
            
            detailedAnalysis[table.id] = await generateDetailedTableAnalysis(table, csvContent, fileName);
          }
        } catch (analysisError) {
          console.error('Error generating detailed analysis:', analysisError);
          // Continue without detailed analysis if there's an error
        }
        
        // Combine the basic report data with detailed analysis
        const enhancedReportData: EnhancedReportData = {
          ...reportData,
          detailedAnalysis
        };
        
        setReportData(enhancedReportData);
        
        // Set the first available tab as active if not already set to overview
        if (activeTab !== 'overview' && reportData.tables.length > 0) {
          setActiveTab('overview');
        }

        // Save the generated report data to the server for future access
        try {
          const token = localStorage.getItem('token');
          await fetch(buildApiUrl(`api/workspaces/${params.id}/report/${params.report_id}`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: {
                reportData: enhancedReportData,
                generatedAt: new Date().toISOString(),
                workspaceName: workspace.name,
                sessionInfo: sessionData ? {
                  usedSessionData: true,
                  sessionDataType: sessionData.isFromSavedInsight ? 'savedInsight' : 'uploadedFiles',
                  fileCount: sessionData.uploadedFiles ? sessionData.uploadedFiles.length : 1
                } : {
                  usedSessionData: false,
                  sessionDataType: 'workspaceDatasets',
                  fileCount: csvFiles.length
                }
              }
            })
          });
        } catch (saveError) {
          console.warn('Failed to save report data:', saveError);
          // Don't throw error as this is optional
        }

      } catch (err: any) {
        console.error('Error loading report data:', err);
        setError(err.message || 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [params.id, params.report_id, router]);

  // Define sidebar tabs based on available summary tables
  const tabs: TabItem[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5 1.5m7.5-1.5l1.5 1.5m-7.5 0V21m7.5 0V21" />
        </svg>
      ),
      tableRefs: []
    }
  ];

  // Add dynamic tabs based on available tables
  if (reportData?.tables) {
    reportData.tables.forEach((table, index) => {
      tabs.push({
        id: table.id,
        title: table.title,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 0A2.25 2.25 0 015.625 3.375h13.5A2.25 2.25 0 0121.375 5.625m0 0v12.75m-9.75-1.125h7.5c.621 0 1.125-.504 1.125-1.125M12 7.5h8.25m-8.25 0a2.25 2.25 0 00-2.25 2.25V12m0 0v2.25a2.25 2.25 0 002.25 2.25M12 7.5V12m8.25-4.5V12m0 0v2.25a2.25 2.25 0 01-2.25 2.25H12m8.25-4.5a2.25 2.25 0 00-2.25-2.25H12m0 0V7.5" />
          </svg>
        ),
        tableRefs: [table.id]
      });
    });
  }

  // Function to filter tables based on active tab
  const getVisibleTables = (): SummaryTable[] => {
    if (activeTab === 'overview') {
      return reportData?.tables || [];
    }
    
    const activeTabItem = tabs.find(tab => tab.id === activeTab);
    if (!activeTabItem || !reportData?.tables) return [];
    
    return reportData.tables.filter(table => 
      activeTabItem.tableRefs.includes(table.id)
    );
  };
  
  // Function to format currency numbers
  const formatCurrency = (value: number | null): string => {
    if (value === null) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Function to format numbers
  const formatNumber = (value: any): string => {
    if (value === null) return '';
    if (typeof value === 'string' && value.includes('%')) return value;
    return new Intl.NumberFormat('en-IN').format(Number(value));
  };
  
  // Function to determine cell class based on value
  const getCellClass = (value: string | number | boolean | null | undefined, isNumeric: boolean = false): string => {
    if (value === null || value === undefined) return '';
    let classes = isNumeric ? styles.number : '';
    
    if (typeof value === 'number') {
      if (value > 0) classes += ' ' + styles.positive;
      else if (value < 0) classes += ' ' + styles.negative;
      else classes += ' ' + styles.neutral;
    }
    
    return classes;
  };

  // Function to get row class based on row type
  const getRowClass = (row: TableRow): string => {
    if (row.isTotal) return styles.total;
    if (row.isSubTotal) return styles.total;
    if (row.isHeader) return styles.total;
    return '';
  };
  // Function to add background logo to PDF pages
  const addBackgroundLogo = (doc: jsPDF, logoImg?: HTMLImageElement) => {
    try {
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add background logo (larger, semi-transparent)
      const logoWidth = 80; // Larger background logo
      const logoHeight = 40;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = (pageHeight - logoHeight) / 2;
      
      // Save current graphics state
      doc.saveGraphicsState();
      
      // Set opacity for background logo (0.08 = 8% opacity for subtle background)
      doc.setGState(doc.GState({ opacity: 0.08 }));
      
      if (logoImg && logoImg.complete) {
        // Add the background logo if image is loaded
        doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      }
      
      // Restore graphics state
      doc.restoreGraphicsState();
    } catch (error) {
      console.error('Error adding background logo:', error);
      // Restore graphics state even on error
      try {
        doc.restoreGraphicsState();
      } catch (restoreError) {
        // Ignore restore errors
      }
    }
  };

  // Function to export the report as PDF with professional structure
  const exportToPdf = async (returnPdfData = false) => {
    if (!reportData || !workspaceData) {
      if (!returnPdfData) {
        toast.error('Report data not available for export');
      }
      return null;
    }
    
    if (!returnPdfData) {
      setIsExportingPdf(true);
    }
    
    try {
      if (!returnPdfData) {
        toast.info('Generating professional PDF report...');
      }
      
      // Preload background logo image
      let backgroundLogoImg: HTMLImageElement | undefined;
      try {
        backgroundLogoImg = new Image();
        backgroundLogoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          backgroundLogoImg!.onload = () => resolve();
          backgroundLogoImg!.onerror = () => {
            console.warn('Background logo failed to load, continuing without it');
            backgroundLogoImg = undefined;
            resolve();
          };
          backgroundLogoImg!.src = '/finaxial-logooo.png';
        });
      } catch (error) {
        console.warn('Error preloading background logo:', error);
        backgroundLogoImg = undefined;
      }
      
      // Check if workspace data exists for use throughout the function
      const workspaceDataExists = sessionStorage.getItem(`workspace_${params.id}_insights`) !== null;
      
      // Retrieve workspace insights and charts from session storage
      let workspaceInsights = null;
      let workspaceCharts = null;
      
      try {
        const insightsString = sessionStorage.getItem(`workspace_${params.id}_insights`);
        const chartsString = sessionStorage.getItem(`workspace_${params.id}_charts`);
        
        if (insightsString) {
          workspaceInsights = JSON.parse(insightsString);
        }
        
        if (chartsString) {
          workspaceCharts = JSON.parse(chartsString);
          
          // Validate charts data - ensure each chart has the necessary properties
          if (Array.isArray(workspaceCharts)) {
            console.log(`Found ${workspaceCharts.length} charts in session storage`);
            // Log the structure of the first chart to help with debugging
            if (workspaceCharts.length > 0) {
              console.log('First chart structure:', 
                Object.keys(workspaceCharts[0]),
                'Has data object?', !!workspaceCharts[0].data,
                'Type:', workspaceCharts[0].type
              );
            }
          } else {
            console.error('Charts data is not an array:', workspaceCharts);
          }
        }
      } catch (error) {
        console.error('Error retrieving workspace data from session storage:', error);
      }
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      const footerY = pageHeight - 15;
    
    // Set document properties
    doc.setProperties({
      title: `${reportName} - Financial Report`,
      subject: 'Comprehensive Financial Analysis Report',
      author: 'Finaxial',
      creator: 'Finaxial Application',
      keywords: 'financial, analysis, report'
    });
    
    // Add background logo to the first page
    addBackgroundLogo(doc, backgroundLogoImg);
    
    // PAGE 1: TITLE PAGE
    // Add Finaxial logo and title page
    doc.setFontSize(24);
    doc.setTextColor(102, 126, 234); // Brand blue color
    doc.setFont('helvetica', 'bold');
    
    // Add actual Finaxial logo
    try {
      // Create an image element to load the logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      // Use a promise to handle logo loading
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            // Add logo to PDF (centered, with appropriate size)
            const logoWidth = 40;
            const logoHeight = 20;
            const logoX = (pageWidth - logoWidth) / 2;
            const logoY = 40;
            
            doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
            resolve(true);
          } catch (error) {
            console.error('Error adding logo to PDF:', error);
            // Fallback to text logo if image fails
            doc.setFillColor(102, 126, 234);
            doc.circle(pageWidth / 2, 60, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('F', pageWidth / 2, 65, { align: 'center' });
            resolve(true);
          }
        };
        
        logoImg.onerror = () => {
          console.error('Failed to load logo image');
          // Fallback to text logo
          doc.setFillColor(102, 126, 234);
          doc.circle(pageWidth / 2, 60, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(20);
          doc.text('F', pageWidth / 2, 65, { align: 'center' });
          resolve(true);
        };
        
        // Load the logo from public folder
        logoImg.src = '/finaxial-logooo.png';
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to simple circle logo
      doc.setFillColor(102, 126, 234);
      doc.circle(pageWidth / 2, 60, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('F', pageWidth / 2, 65, { align: 'center' });
    }
    
    // Company name
    doc.setTextColor(102, 126, 234);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('FINAXIAL', pageWidth / 2, 95, { align: 'center' });
    
    // Report title
    doc.setTextColor(45, 55, 72);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('FINANCIAL ANALYSIS REPORT', pageWidth / 2, 120, { align: 'center' });
    
    // Workspace name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(workspaceData.name || 'Financial Workspace', pageWidth / 2, 140, { align: 'center' });
    
    // Generated date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${reportDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, pageWidth / 2, 160, { align: 'center' });
    
    // Add decorative line
    doc.setLineWidth(0.5);
    doc.setDrawColor(102, 126, 234);
    doc.line(margin, 180, pageWidth - margin, 180);
    
    // Add professional note
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    const note = 'This report contains confidential financial analysis and should be treated as proprietary information.';
    const noteLines = doc.splitTextToSize(note, contentWidth - 40);
    doc.text(noteLines, pageWidth / 2, 210, { align: 'center' });
    
    // PAGE 2: TABLE OF CONTENTS
    doc.addPage();
    addBackgroundLogo(doc, backgroundLogoImg);
    
    // TOC Title
    doc.setFontSize(24);
    doc.setTextColor(45, 55, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('TABLE OF CONTENTS', margin, 40);
    
    // Add underline
    doc.setLineWidth(0.5);
    doc.setDrawColor(102, 126, 234);
    doc.line(margin, 45, pageWidth - margin, 45);
    
    let tocY = 65;
    let currentPage = 3; // Starting from page 3
    
    // TOC entries with more accurate page counting
    const tocEntries = [
      { title: 'Executive Summary', page: currentPage },
    ];
    
    // If workspace data exists, add entries for it
    if (workspaceDataExists) {
      currentPage++; // Move to next page for Workspace Insights
      tocEntries.push({ title: 'Workspace Insights', page: currentPage });
      
      // Check if we have workspace charts
      const hasWorkspaceCharts = workspaceCharts && 
                               Array.isArray(workspaceCharts) && 
                               workspaceCharts.length > 0;
      
      if (hasWorkspaceCharts) {
        currentPage++; // Move to next page for Data Visualizations
        tocEntries.push({ title: 'Data Visualizations', page: currentPage });
      }
    }
    
    // Add recommendations if they exist
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      currentPage++; // Move to next page for recommendations
      tocEntries.push({ title: 'Strategic Recommendations', page: currentPage });
    }
    
    currentPage++; // Move to next page for first financial table
    tocEntries.push({ title: 'Financial Tables Analysis', page: currentPage });
    
    // Add table entries to TOC
    reportData.tables.forEach((table, index) => {
      tocEntries.push({
        title: `${index + 1}. ${table.title}`,
        page: currentPage + index
      });
    });
    
    // Add comprehensive analysis to TOC
    currentPage += reportData.tables.length;
    tocEntries.push({
      title: 'Comprehensive Financial Analysis',
      page: currentPage
    });
    
    // Add conclusion to TOC
    tocEntries.push({
      title: 'Conclusion',
      page: currentPage // Same page as comprehensive analysis
    });
    
    // Render TOC entries
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 55, 72);
    
    tocEntries.forEach((entry, index) => {
      const yPos = tocY + (index * 8);
      
      // Entry title
      doc.text(entry.title, margin, yPos);
      
      // Dotted line
      const titleWidth = doc.getTextWidth(entry.title);
      const pageNumWidth = doc.getTextWidth(entry.page.toString());
      const dotsWidth = contentWidth - titleWidth - pageNumWidth - 10;
      const dotCount = Math.floor(dotsWidth / 3);
      const dots = '.'.repeat(dotCount);
      
      doc.setTextColor(156, 163, 175);
      doc.text(dots, margin + titleWidth + 5, yPos);
      
      // Page number
      doc.setTextColor(45, 55, 72);
      doc.text(entry.page.toString(), pageWidth - margin, yPos, { align: 'right' });
    });
    
    // PAGE 3: EXECUTIVE SUMMARY
    doc.addPage();
    addBackgroundLogo(doc, backgroundLogoImg);
    
    doc.setFontSize(20);
    doc.setTextColor(45, 55, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', margin, 40);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(102, 126, 234);
    doc.line(margin, 45, pageWidth - margin, 45);
    
    if (reportData.summary) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const summaryLines = doc.splitTextToSize(reportData.summary, contentWidth);
      doc.text(summaryLines, margin, 60);
    }
    
    // Add insights section
    let insightY = 135; // Declare variable outside the if block
    if (reportData.insights && reportData.insights.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 55, 72);
      doc.text('Key Insights', margin, 120);
      
      insightY = 135;
      reportData.insights.forEach((insight, index) => {
        // Check if we need a new page
        if (insightY > pageHeight - 60) {
          doc.addPage();
          addBackgroundLogo(doc, backgroundLogoImg);
          insightY = 40;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        
        // Properly wrap text within margins
        const bulletPoint = `• ${insight}`;
        const wrappedLines = doc.splitTextToSize(bulletPoint, contentWidth - 10);
        doc.text(wrappedLines, margin + 5, insightY);
        insightY += wrappedLines.length * 5 + 3; // Add spacing between insights
      });
    }
    
    // Use workspace insights and charts we already loaded in the beginning of the function
    
    // WORKSPACE INSIGHTS SECTION
    if (workspaceInsights) {
      try {
        doc.addPage();
        addBackgroundLogo(doc, backgroundLogoImg);
        
        doc.setFontSize(20);
        doc.setTextColor(45, 55, 72);
        doc.setFont('helvetica', 'bold');
        doc.text('WORKSPACE INSIGHTS', margin, 40);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(102, 126, 234);
        doc.line(margin, 45, pageWidth - margin, 45);
        
        // Add file information
        if (workspaceInsights.fileNames && Array.isArray(workspaceInsights.fileNames) && workspaceInsights.fileNames.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Analyzed Files', margin, 60);
        
        let fileY = 70;
        workspaceInsights.fileNames.forEach((fileName: string, index: number) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(75, 85, 99);
          doc.text(`• ${fileName}`, margin + 5, fileY);
          fileY += 6;
        });
      }
      
      // Add summary from workspace insights
      if (workspaceInsights.summary) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Summary', margin, 90);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const summaryLines = doc.splitTextToSize(workspaceInsights.summary, contentWidth);
        doc.text(summaryLines, margin, 100);
      }
      
      // Add insights from workspace
      if (workspaceInsights.insights && workspaceInsights.insights.length > 0) {
        let wsInsightY = 130;
        
        // Check if we need a new page
        if (wsInsightY > pageHeight - 80) {
          doc.addPage();
          addBackgroundLogo(doc, backgroundLogoImg);
          wsInsightY = 40;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Key Financial Insights', margin, wsInsightY);
        
        wsInsightY += 10;
        workspaceInsights.insights.forEach((insight: string, index: number) => {
          // Check if we need a new page
          if (wsInsightY > pageHeight - 40) {
            doc.addPage();
            addBackgroundLogo(doc, backgroundLogoImg);
            wsInsightY = 40;
          }
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(75, 85, 99);
          
          const bulletPoint = `• ${insight}`;
          const wrappedLines = doc.splitTextToSize(bulletPoint, contentWidth - 10);
          doc.text(wrappedLines, margin + 5, wsInsightY);
          wsInsightY += wrappedLines.length * 5 + 3;
        });
      }
      
      // Financial metrics section removed as per requirement
      
      } catch (insightError) {
        console.error("Error adding workspace insights to PDF:", insightError);
        // Add error message to the PDF
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69);
        doc.text("Error adding workspace insights. Some data may be missing.", margin, 100);
      }
    }
    
    // WORKSPACE VISUALIZATIONS SECTION
    if (workspaceCharts && workspaceCharts.length > 0) {
      try {
        doc.addPage();
        addBackgroundLogo(doc, backgroundLogoImg);
        
        doc.setFontSize(20);
        doc.setTextColor(45, 55, 72);
        doc.setFont('helvetica', 'bold');
        doc.text('DATA VISUALIZATIONS', margin, 40);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(102, 126, 234);
        doc.line(margin, 45, pageWidth - margin, 45);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Key visualizations from your financial data analysis', margin, 55);
        
        let chartY = 70;
      
      // Loop through workspace charts and render them to the PDF
      for (let i = 0; i < workspaceCharts.length; i++) {
        const chart = workspaceCharts[i];
        
        if (!chart || !chart.title) {
          console.error('Invalid chart data at index', i, chart);
          continue;
        }
        
        // Check if we need a new page
        if (chartY > pageHeight - 100) {
          doc.addPage();
          addBackgroundLogo(doc, backgroundLogoImg);
          chartY = 40;
        }
        
        // Add chart title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        doc.text(`${i + 1}. ${chart.title}`, margin, chartY);
        chartY += 10;
        
        // Add chart description
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const descriptionLines = doc.splitTextToSize(chart.description || 'No description available', contentWidth);
        doc.text(descriptionLines, margin, chartY);
        chartY += descriptionLines.length * 5 + 10;
        
        try {
          // Create a canvas element to render the chart
          const canvas = document.createElement('canvas');
          canvas.width = 800; // Wider canvas for better quality
          canvas.height = 400; // More appropriate height for better aspect ratio
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
          
          // Prepare chart data - handle various data formats
          let chartData;
          let chartType = chart.type || 'bar'; // Default to bar chart
          
          // Log the chart structure for debugging
          console.log(`Rendering chart ${i+1}: ${chart.title}`, { 
            hasLabels: !!chart.labels, 
            hasDatasets: !!chart.datasets,
            hasData: !!chart.data,
            chartType
          });
          
          // Try different ways to extract chart data
          if (chart.data && chart.data.labels && chart.data.datasets) {
            // Standard Chart.js format
            chartData = chart.data;
          } else if (chart.labels && Array.isArray(chart.labels)) {
            // Chart has separate labels and data arrays
            let dataPoints;
            
            if (Array.isArray(chart.data)) {
              dataPoints = chart.data;
            } else if (chart.datasets && Array.isArray(chart.datasets)) {
              // If there are multiple datasets
              dataPoints = chart.datasets;
            } else {
              // Create sample data if nothing else works
              dataPoints = new Array(chart.labels.length).fill(0).map(() => Math.floor(Math.random() * 100));
            }
            
            // Create standard Chart.js data structure
            chartData = {
              labels: chart.labels,
              datasets: [{
                label: chart.title,
                data: dataPoints,
                backgroundColor: [
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(153, 102, 255, 0.5)',
                  'rgba(255, 159, 64, 0.5)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
              }]
            };
          } else {
            // If we don't have labels, create placeholders
            chartData = {
              labels: ['No data', 'available', 'for', 'this', 'chart'],
              datasets: [{
                label: chart.title,
                data: [5, 10, 15, 20, 25],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            };
          }
          
          // Create chart configuration
          const chartConfig: any = {
            type: chartType,
            data: chartData,
            options: {
              responsive: false,
              animation: false,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    boxWidth: 15,
                    font: {
                      size: 13
                    }
                  }
                },
                title: {
                  display: false
                },
                tooltip: {
                  enabled: false // Disable tooltips in static PDF
                }
              },
              layout: {
                padding: {
                  left: 10,
                  right: 10,
                  top: 10,
                  bottom: 10
                }
              },
              scales: {
                y: {
                  beginAtZero: chartType !== 'line', // Don't force zero start for line charts
                  grid: {
                    color: 'rgba(0,0,0,0.05)'
                  },
                  ticks: {
                    font: {
                      size: 11
                    }
                  }
                },
                x: {
                  grid: {
                    color: 'rgba(0,0,0,0.05)'
                  },
                  ticks: {
                    font: {
                      size: 11
                    }
                  }
                }
              }
            }
          };
          
          // Create a new chart instance with the chart configuration
          const chartInstance = new Chart(ctx, chartConfig);
          
          // Wait a moment to ensure chart is rendered
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Convert canvas to image and add to PDF
          const imgData = canvas.toDataURL('image/png');
          // Use more proportional dimensions - standard aspect ratio (16:9)
          const chartWidth = contentWidth;
          const chartHeight = contentWidth * 0.5625; // 16:9 aspect ratio
          doc.addImage(imgData, 'PNG', margin, chartY, chartWidth, chartHeight);
          chartY += chartHeight + 10; // Move down after adding the chart image
          
          // Add chart type info
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(107, 114, 128);
          doc.text(`Chart type: ${chartType}`, margin, chartY);
          chartY += 25;
          
          // Destroy chart to prevent memory leaks
          chartInstance.destroy();
        } catch (chartError) {
          console.error('Error rendering chart to PDF:', chartError);
          
          // Add a message about the chart visualization
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(220, 53, 69);
          doc.text('Chart visualization could not be rendered. See the description above.', margin, chartY);
          chartY += 15;
          
          // Still add chart type if available
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(`Chart type: ${chart.type || 'Unknown'}`, margin, chartY);
          chartY += 25;
        }
        
        // Add extra space between charts
        chartY += 10;
      }
      } catch (visualizationError) {
        console.error("Error adding visualizations to PDF:", visualizationError);
        // Add error message to the PDF
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69);
        doc.text("Error adding visualizations to PDF. Charts could not be rendered.", margin, 100);
      }
    }

    // Add recommendations section
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      // Always start recommendations on a new page for consistent page numbering
      doc.addPage();
      addBackgroundLogo(doc, backgroundLogoImg);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 55, 72);
      doc.text('Strategic Recommendations', margin, 40);
      
      let recY = 60;
      reportData.recommendations.forEach((rec, index) => {
        // Check if we need a new page
        if (recY > pageHeight - 60) {
          doc.addPage();
          addBackgroundLogo(doc, backgroundLogoImg);
          recY = 40;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        
        // Properly wrap text within margins
        const bulletPoint = `• ${rec}`;
        const wrappedLines = doc.splitTextToSize(bulletPoint, contentWidth - 10);
        doc.text(wrappedLines, margin + 5, recY);
        recY += wrappedLines.length * 5 + 3; // Add spacing between recommendations
      });
    }
    
    // PAGES 4+: FINANCIAL TABLES WITH DETAILED ANALYSIS
    reportData.tables.forEach((table, tableIndex) => {
      doc.addPage(); // Each table starts on a new page
      addBackgroundLogo(doc, backgroundLogoImg);
      
      // Table title
      doc.setFontSize(18);
      doc.setTextColor(45, 55, 72);
      doc.setFont('helvetica', 'bold');
      doc.text(table.title, margin, 40);
      
      // Table description
      if (table.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const descLines = doc.splitTextToSize(table.description, contentWidth);
        doc.text(descLines, margin, 50);
      }
      
      // Prepare table data for autoTable
      const tableData = table.data.map(row => 
        table.columns.map(col => {
          const value = row[col.accessor];
          if (col.isCurrency && typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          }
          if (col.isNumeric && typeof value === 'number') {
            return new Intl.NumberFormat('en-US').format(value);
          }
          return value?.toString() || '';
        })
      );
      
      const tableHeaders = table.columns.map(col => col.header);
      
      // Generate table using autoTable
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 70,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        tableLineColor: [229, 231, 235],
        tableLineWidth: 0.1,
      });
      
      // Add detailed analysis if available
      const detailedAnalysis = reportData.detailedAnalysis?.[table.id];
      if (detailedAnalysis) {
        const finalY = (doc as any).lastAutoTable?.finalY || 120;
        let analysisY = finalY + 20;
        
        // Check if we need a new page for analysis
        if (analysisY > pageHeight - 80) {
          doc.addPage();
          addBackgroundLogo(doc, backgroundLogoImg);
          analysisY = 40;
        }
        
        // Analysis title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        doc.text('Detailed Analysis', margin, analysisY);
        
        analysisY += 15;
        
        // Business Context
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Business Context', margin, analysisY);
        
        analysisY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const contextLines = doc.splitTextToSize(detailedAnalysis.businessContext, contentWidth);
        doc.text(contextLines, margin, analysisY);
        analysisY += contextLines.length * 4 + 8;
        
        // Financial Implications
        if (analysisY > pageHeight - 50) {
          doc.addPage();
          analysisY = 40;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Financial Implications', margin, analysisY);
        
        analysisY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const implLines = doc.splitTextToSize(detailedAnalysis.financialImplications, contentWidth);
        doc.text(implLines, margin, analysisY);
        analysisY += implLines.length * 4 + 8;
        
        // Industry Benchmark
        if (analysisY > pageHeight - 50) {
          doc.addPage();
          addBackgroundLogo(doc, backgroundLogoImg);
          analysisY = 40;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Industry Benchmark', margin, analysisY);
        
        analysisY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const benchLines = doc.splitTextToSize(detailedAnalysis.industryBenchmark, contentWidth);
        doc.text(benchLines, margin, analysisY);
        analysisY += benchLines.length * 4 + 8;
        
        // Risk Factors
        if (detailedAnalysis.riskFactors && detailedAnalysis.riskFactors.length > 0) {
          if (analysisY > pageHeight - 50) {
            doc.addPage();
            addBackgroundLogo(doc, backgroundLogoImg);
            analysisY = 40;
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 53, 69);
          doc.text('Risk Factors', margin, analysisY);
          
          analysisY += 8;
          detailedAnalysis.riskFactors.forEach((risk, index) => {
            // Check if we need a new page before adding risk factor
            if (analysisY > pageHeight - 40) {
              doc.addPage();
              addBackgroundLogo(doc, backgroundLogoImg);
              analysisY = 40;
            }
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            
            // Properly wrap risk factor text within margins
            const bulletPoint = `• ${risk}`;
            const wrappedRiskLines = doc.splitTextToSize(bulletPoint, contentWidth - 10);
            doc.text(wrappedRiskLines, margin + 5, analysisY);
            analysisY += wrappedRiskLines.length * 5 + 2; // Add proper spacing
          });
        }
      }
    });
    
    // FINAL PAGE: COMPREHENSIVE FINANCIAL ANALYSIS SUMMARY
    doc.addPage();
    addBackgroundLogo(doc, backgroundLogoImg);
    
    doc.setFontSize(20);
    doc.setTextColor(45, 55, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPREHENSIVE FINANCIAL ANALYSIS', margin, 40);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(102, 126, 234);
    doc.line(margin, 45, pageWidth - margin, 45);
    
    let summaryY = 65;
    
    // Overall business context summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('Overall Assessment', margin, summaryY);
    
    summaryY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    
    const overallSummary = `This comprehensive financial analysis encompasses ${reportData.tables.length} key financial areas, ` +
      `providing detailed insights into business performance, financial health, and strategic positioning. ` +
      `${workspaceDataExists ? 'The report includes both workspace insights and visualizations along with detailed tables. ' : ''}` +
      `The analysis considers industry benchmarks, identifies key risk factors, and provides actionable recommendations ` +
      `for enhanced financial performance and strategic decision-making.`;
    
    const summaryLines = doc.splitTextToSize(overallSummary, contentWidth);
    doc.text(summaryLines, margin, summaryY);
    summaryY += summaryLines.length * 4 + 15;
    
    // Key findings
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('Key Findings', margin, summaryY);
    
    summaryY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    
    const keyFindings = [
      `Analyzed ${reportData.tables.length} comprehensive financial datasets`,
      'Identified strategic opportunities for performance improvement',
      'Assessed financial health against industry benchmarks',
      'Highlighted critical risk factors requiring attention',
      'Provided actionable recommendations for strategic implementation'
    ];
    
    keyFindings.forEach(finding => {
      // Check if we need a new page
      if (summaryY > pageHeight - 40) {
        doc.addPage();
        addBackgroundLogo(doc, backgroundLogoImg);
        summaryY = 40;
      }
      
      // Properly wrap finding text within margins
      const bulletPoint = `• ${finding}`;
      const wrappedFindingLines = doc.splitTextToSize(bulletPoint, contentWidth - 10);
      doc.text(wrappedFindingLines, margin + 5, summaryY);
      summaryY += wrappedFindingLines.length * 5 + 2; // Add proper spacing
    });
    
    // Add Conclusion section
    summaryY += 15;
    
    // Check if we need a new page for conclusion
    if (summaryY > pageHeight - 80) {
      doc.addPage();
      addBackgroundLogo(doc, backgroundLogoImg);
      summaryY = 40;
    }
    
    // Conclusion heading
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('CONCLUSION', margin, summaryY);
    
    summaryY += 15;
    
    // Generate comprehensive conclusion paragraph
    const conclusionText = `In conclusion, the financial analysis presented in this report provides a comprehensive overview of the organization's current financial position and future outlook. The data reveals ${
      reportData.insights && reportData.insights.length > 0 
        ? 'key insights including ' + reportData.insights.slice(0, 2).join('; ') + '; '
        : ''
    }${
      workspaceDataExists && workspaceCharts && workspaceCharts.length > 0
        ? 'supported by visualizations that highlight critical trends in the financial data. '
        : ''
    }The analysis of ${reportData.tables.length} financial tables demonstrates ${
      reportData.recommendations && reportData.recommendations.length > 0
        ? 'opportunities for improvement through strategic actions such as ' + reportData.recommendations.slice(0, 2).join(' and ') + '. '
        : 'several opportunities for strategic improvement. '
    }Moving forward, management should focus on implementing the recommended actions while monitoring key financial indicators to ensure sustainable growth and financial stability. This report serves as both an analytical tool and a strategic roadmap for enhancing financial performance in the coming fiscal period.`;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const conclusionLines = doc.splitTextToSize(conclusionText, contentWidth);
    doc.text(conclusionLines, margin, summaryY);
    
    // Add space after conclusion
    summaryY += conclusionLines.length * 4 + 15;
    
    // COMPLIANCE AND DATA SECURITY SECTION
    // Check if we need a new page
    if (summaryY > pageHeight - 100) {
      doc.addPage();
      addBackgroundLogo(doc, backgroundLogoImg);
      summaryY = 40;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('Data Security & Regulatory Compliance', margin, summaryY);
    
    summaryY += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    
    const complianceIntro = `This financial analysis report has been prepared in accordance with applicable data protection and financial regulations. Our data handling practices comply with the following key legislative frameworks:`;
    const introLines = doc.splitTextToSize(complianceIntro, contentWidth);
    doc.text(introLines, margin, summaryY);
    summaryY += introLines.length * 4 + 8;
    
    // Add compliance laws
    const complianceLaws = [
      {
        title: "Information Technology Act, 2000 & IT (Reasonable Security Practices) Rules, 2011",
        description: "Ensures protection of financial data classified as sensitive personal data or information (SPDI), with strict liability for data breaches and unauthorized disclosure."
      },
      {
        title: "Prevention of Money Laundering Act, 2002",
        description: "Mandates secure retention of transaction records for 10 years and establishes confidentiality requirements for financial institutions handling customer data."
      },
      {
        title: "Banking Regulation Act, 1949",
        description: "Protects banking companies from unauthorized disclosure of confidential customer information and financial records."
      },
      {
        title: "Credit Information Companies (Regulation) Act, 2005",
        description: "Establishes comprehensive privacy principles for credit information protection, including data collection limitation, personal access rights, and disclosure purpose limitation."
      },
      {
        title: "RBI Guidelines on Internet Banking, 2011",
        description: "Prescribes minimum security baselines for data confidentiality, encryption standards, access controls, and breach notification requirements."
      }
    ];
    
    complianceLaws.forEach((law, index) => {
      // Check if we need a new page
      if (summaryY > pageHeight - 80) {
        doc.addPage();
        addBackgroundLogo(doc, backgroundLogoImg);
        summaryY = 40;
      }
      
      // Law title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(67, 56, 202);
      const titleLines = doc.splitTextToSize(`${index + 1}. ${law.title}`, contentWidth - 10);
      doc.text(titleLines, margin + 5, summaryY);
      summaryY += titleLines.length * 4 + 3;
      
      // Law description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const descLines = doc.splitTextToSize(law.description, contentWidth - 10);
      doc.text(descLines, margin + 5, summaryY);
      summaryY += descLines.length * 3.5 + 6;
    });
    
    // Add compliance footer note
    if (summaryY > pageHeight - 60) {
      doc.addPage();
      summaryY = 40;
    }
    
    summaryY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Data Security Assurance', margin, summaryY);
    
    summaryY += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const securityNote = `All financial data processed in this report is handled in accordance with the above regulatory frameworks. Data encryption, access controls, and retention policies are maintained as per statutory requirements. No sensitive customer information is stored beyond the prescribed legal timeframes, and all data handling procedures follow industry best practices for financial data security.`;
    const securityLines = doc.splitTextToSize(securityNote, contentWidth);
    doc.text(securityLines, margin, summaryY);
    
    // Add footer with page numbers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setLineWidth(0.3);
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      
      if (i === 1) {
        // Title page - no page number
        doc.text('Finaxial Financial Analysis Report', pageWidth / 2, footerY, { align: 'center' });
      } else {
        doc.text('Finaxial Financial Analysis Report', margin, footerY);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      }
    }
    
    // Save the PDF with a descriptive name or return as base64
    const fileName = `${workspaceData.name || 'Financial'}-${workspaceDataExists ? 'Complete-' : ''}Report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (returnPdfData) {
      // Return PDF as base64 for email
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      return pdfBase64;
    } else {
      // Download the PDF
      doc.save(fileName);
      
      // Show appropriate success message based on what was included
      if (workspaceDataExists) {
        toast.success('Complete PDF report with workspace insights and tables generated successfully!');
      } else {
        toast.success('Professional PDF report generated successfully!');
      }
    }
    
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (!returnPdfData) {
        toast.error('Failed to generate PDF report. Please try again.');
      }
      return null;
    } finally {
      if (!returnPdfData) {
        setIsExportingPdf(false);
      }
    }
  };

  // Function to handle email sending
  const handleSendEmail = async (emailData: any) => {
    setIsSendingEmail(true);
    
    try {
      let fileData: string;
      let fileName: string;
      let contentType: string;
      
      const baseFileName = `${workspaceData?.name || 'Financial'}-Report-${new Date().toISOString().split('T')[0]}`;
      
      // Generate data based on selected format
      switch (emailData.exportFormat) {
        case 'pdf':
          // Generate PDF as base64 using the same function as export
          const pdfData = await exportToPdf(true);
          if (!pdfData) {
            throw new Error('Failed to generate PDF for email');
          }
          fileData = pdfData;
          fileName = `${baseFileName}.pdf`;
          contentType = 'application/pdf';
          break;
          
        case 'word':
          // Generate Word document HTML content
          fileData = await generateWordContent();
          fileName = `${baseFileName}.doc`;
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
          
        case 'xml':
          // Generate XML content
          fileData = await generateXMLContent();
          fileName = `${baseFileName}.xml`;
          contentType = 'application/xml';
          break;
          
        default:
          throw new Error('Invalid export format selected');
      }

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
          recipientEmail: emailData.recipientEmail,
          recipientName: emailData.recipientName,
          fileData: fileData,
          fileName: fileName,
          contentType: contentType,
          exportFormat: emailData.exportFormat,
          workspaceName: emailData.workspaceName,
          customMessage: emailData.customMessage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast.success(`Report email sent successfully as ${emailData.exportFormat.toUpperCase()}!`);
      setIsEmailModalOpen(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(error.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Helper function to generate Word content for email
  const generateWordContent = async (): Promise<string> => {
    if (!reportData) {
      throw new Error('No data available for Word export');
    }

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Financial Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
            h2 { color: #1e40af; margin-top: 25px; margin-bottom: 15px; }
            h3 { color: #374151; margin-top: 20px; margin-bottom: 10px; }
            h4 { color: #4b5563; margin-top: 15px; margin-bottom: 8px; }
            .report-header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .section { margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .metric { margin: 10px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Financial Analysis Report</h1>
            <p><strong>Workspace:</strong> ${workspaceData?.name || 'Financial Analysis'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
    `;

    // Add tables data if available
    if (reportData.tables && Array.isArray(reportData.tables)) {
      reportData.tables.forEach((table: any, index: number) => {
        htmlContent += `
          <div class="section">
            <h2>Table ${index + 1}: ${table.title || 'Financial Data'}</h2>
        `;
        
        if (table.data && Array.isArray(table.data) && table.data.length > 0) {
          htmlContent += '<table>';
          
          // Add headers
          const headers = Object.keys(table.data[0]);
          htmlContent += '<tr>';
          headers.forEach(header => {
            htmlContent += `<th>${header}</th>`;
          });
          htmlContent += '</tr>';
          
          // Add data rows
          table.data.forEach((row: any) => {
            htmlContent += '<tr>';
            headers.forEach(header => {
              htmlContent += `<td>${row[header] || ''}</td>`;
            });
            htmlContent += '</tr>';
          });
          
          htmlContent += '</table>';
        }
        
        // Add detailed analysis if available
        if (table.detailedAnalysis) {
          const detailedAnalysis = table.detailedAnalysis;
          htmlContent += `
            <div class="analysis">
              <h3>Analysis</h3>
              <p><strong>Summary:</strong> ${detailedAnalysis.summary}</p>
              
              <h4>Key Metrics</h4>
              <ul>
          `;
          
          detailedAnalysis.keyMetrics?.forEach((metric: string) => {
            htmlContent += `<li>${metric}</li>`;
          });

          htmlContent += `
              </ul>
              
              <h4>Recommendations</h4>
              <ul>
          `;
          
          detailedAnalysis.recommendations?.forEach((recommendation: string) => {
            htmlContent += `<li>${recommendation}</li>`;
          });

          htmlContent += `
              </ul>
              
              <h4>Forecast Insights</h4>
              <p>${detailedAnalysis.forecastInsights}</p>
            </div>
          `;
        }
        
        htmlContent += '</div>';
      });
    }

    htmlContent += `
        </body>
      </html>
    `;

    // Convert HTML to base64 for email sending
    return btoa(unescape(encodeURIComponent(htmlContent)));
  };

  // Helper function to generate XML content for email
  const generateXMLContent = async (): Promise<string> => {
    if (!reportData) {
      throw new Error('No data available for XML export');
    }

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinancialReport>
  <ReportInfo>
    <WorkspaceName>${workspaceData?.name || 'Financial'}</WorkspaceName>
    <GeneratedDate>${new Date().toISOString()}</GeneratedDate>
  </ReportInfo>
  <Tables>`;

    if (reportData.tables && Array.isArray(reportData.tables)) {
      reportData.tables.forEach((table: any, index: number) => {
        xmlContent += `
    <Table id="${index + 1}">
      <Title>${table.title || 'Financial Data'}</Title>`;
      
        if (table.data && Array.isArray(table.data)) {
          xmlContent += `
      <Data>`;
          table.data.forEach((row: any, rowIndex: number) => {
            xmlContent += `
        <Row id="${rowIndex + 1}">`;
            Object.entries(row).forEach(([key, value]) => {
              xmlContent += `
          <${key}>${value}</${key}>`;
            });
            xmlContent += `
        </Row>`;
          });
          xmlContent += `
      </Data>`;
        }
        
        if (table.detailedAnalysis) {
          const analysis = table.detailedAnalysis;
          xmlContent += `
      <Analysis>
        <Summary>${analysis.summary}</Summary>
        <KeyMetrics>`;
          analysis.keyMetrics?.forEach((metric: string, metricIndex: number) => {
            xmlContent += `
          <Metric id="${metricIndex + 1}">${metric}</Metric>`;
          });
          xmlContent += `
        </KeyMetrics>
        <Recommendations>`;
          analysis.recommendations?.forEach((rec: string, recIndex: number) => {
            xmlContent += `
          <Recommendation id="${recIndex + 1}">${rec}</Recommendation>`;
          });
          xmlContent += `
        </Recommendations>
        <ForecastInsights>${analysis.forecastInsights}</ForecastInsights>
      </Analysis>`;
        }
        
        xmlContent += `
    </Table>`;
      });
    }

    xmlContent += `
  </Tables>
</FinancialReport>`;

    // Convert XML to base64 for email sending
    return btoa(unescape(encodeURIComponent(xmlContent)));
  };

  // Function to export to Word format
  const exportToWord = async () => {
    if (!reportData) {
      toast.error('No data available for export');
      return;
    }

    setExporting(true);
    try {
      // Generate HTML content for the report
      let htmlContent = `
        <html>
          <head>
            <title>${workspaceData?.name || 'Financial'} Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
              h2 { color: #374151; margin-top: 30px; }
              h3 { color: #4b5563; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .analysis { background-color: #f8fafc; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
              .risk { color: #dc2626; }
              .opportunity { color: #059669; }
            </style>
          </head>
          <body>
            <h1>${workspaceData?.name || 'Financial'} Report</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
      `;

      // Add tables and analysis
      const visibleTables = reportData.tables.filter((table: any) => 
        activeTab === 'overview' ? true : activeTab === table.id
      );

      visibleTables.forEach((table: any) => {
        htmlContent += `
          <h2>${table.title}</h2>
          <p>${table.description}</p>
          <table>
            <thead>
              <tr>
        `;
        
        table.columns.forEach((column: any) => {
          htmlContent += `<th>${column.header}</th>`;
        });
        
        htmlContent += `
              </tr>
            </thead>
            <tbody>
        `;
        
        table.data.forEach((row: any) => {
          htmlContent += '<tr>';
          table.columns.forEach((column: any) => {
            const value = row[column.accessor];
            let cellValue = '';
            if (column.isNumeric && column.isCurrency && typeof value === 'number') {
              cellValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(value);
            } else if (column.isNumeric) {
              cellValue = typeof value === 'number' ? value.toLocaleString() : value;
            } else {
              cellValue = value || '';
            }
            htmlContent += `<td>${cellValue}</td>`;
          });
          htmlContent += '</tr>';
        });
        
        htmlContent += `
            </tbody>
          </table>
        `;

        // Add detailed analysis if available
        const detailedAnalysis = reportData.detailedAnalysis?.[table.id];
        if (detailedAnalysis) {
          htmlContent += `
            <div class="analysis">
              <h3>📊 Comprehensive Financial Analysis</h3>
              <h4>Business Context</h4>
              <p>${detailedAnalysis.businessContext}</p>
              
              <h4>Financial Implications</h4>
              <p>${detailedAnalysis.financialImplications}</p>
              
              <h4>Industry Benchmark</h4>
              <p>${detailedAnalysis.industryBenchmark}</p>
              
              <h4>Risk Factors</h4>
              <ul>
          `;
          
          detailedAnalysis.riskFactors?.forEach((risk: string) => {
            htmlContent += `<li class="risk">${risk}</li>`;
          });
          
          htmlContent += `
              </ul>
              
              <h4>Opportunities</h4>
              <ul>
          `;
          
          detailedAnalysis.opportunities?.forEach((opportunity: string) => {
            htmlContent += `<li class="opportunity">${opportunity}</li>`;
          });
          
          htmlContent += `
              </ul>
              
              <h4>Recommendations</h4>
              <ul>
          `;
          
          detailedAnalysis.recommendations?.forEach((recommendation: string) => {
            htmlContent += `<li>${recommendation}</li>`;
          });
          
          htmlContent += `
              </ul>
              
              <h4>Forecast Insights</h4>
              <p>${detailedAnalysis.forecastInsights}</p>
            </div>
          `;
        }
      });

      htmlContent += `
          </body>
        </html>
      `;

      // Create and download the Word document
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workspaceData?.name || 'Financial'}-Report-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Word document exported successfully!');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      toast.error('Failed to export Word document');
    } finally {
      setExporting(false);
    }
  };

  // Function to export to XML format
  const exportToXML = async () => {
    if (!reportData) {
      toast.error('No data available for export');
      return;
    }

    setExporting(true);
    try {
      let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinancialReport>
  <ReportInfo>
    <WorkspaceName>${workspaceData?.name || 'Financial'}</WorkspaceName>
    <GeneratedDate>${new Date().toISOString()}</GeneratedDate>
    <ReportType>Financial Analysis Report</ReportType>
  </ReportInfo>
  <Tables>`;

      // Add tables data
      const visibleTables = reportData.tables.filter((table: any) => 
        activeTab === 'overview' ? true : activeTab === table.id
      );

      visibleTables.forEach((table: any) => {
        xmlContent += `
    <Table id="${table.id}">
      <Title>${table.title}</Title>
      <Description>${table.description}</Description>
      <Columns>`;
      
        table.columns.forEach((column: any) => {
          xmlContent += `
        <Column>
          <Header>${column.header}</Header>
          <Accessor>${column.accessor}</Accessor>
          <IsNumeric>${column.isNumeric}</IsNumeric>
          <IsCurrency>${column.isCurrency || false}</IsCurrency>
        </Column>`;
        });
        
        xmlContent += `
      </Columns>
      <Data>`;
      
        table.data.forEach((row: any, index: number) => {
          xmlContent += `
        <Row index="${index}">`;
          table.columns.forEach((column: any) => {
            const value = row[column.accessor];
            xmlContent += `
          <Cell column="${column.accessor}">${value || ''}</Cell>`;
          });
          xmlContent += `
        </Row>`;
        });
        
        xmlContent += `
      </Data>`;

        // Add detailed analysis if available
        const detailedAnalysis = reportData.detailedAnalysis?.[table.id];
        if (detailedAnalysis) {
          xmlContent += `
      <Analysis>
        <BusinessContext>${detailedAnalysis.businessContext}</BusinessContext>
        <FinancialImplications>${detailedAnalysis.financialImplications}</FinancialImplications>
        <IndustryBenchmark>${detailedAnalysis.industryBenchmark}</IndustryBenchmark>
        <RiskFactors>`;
        
          detailedAnalysis.riskFactors?.forEach((risk: string) => {
            xmlContent += `
          <Risk>${risk}</Risk>`;
          });
          
          xmlContent += `
        </RiskFactors>
        <Opportunities>`;
        
          detailedAnalysis.opportunities?.forEach((opportunity: string) => {
            xmlContent += `
          <Opportunity>${opportunity}</Opportunity>`;
          });
          
          xmlContent += `
        </Opportunities>
        <Recommendations>`;
        
          detailedAnalysis.recommendations?.forEach((recommendation: string) => {
            xmlContent += `
          <Recommendation>${recommendation}</Recommendation>`;
          });
          
          xmlContent += `
        </Recommendations>
        <ForecastInsights>${detailedAnalysis.forecastInsights}</ForecastInsights>
      </Analysis>`;
        }
        
        xmlContent += `
    </Table>`;
      });

      xmlContent += `
  </Tables>
</FinancialReport>`;

      // Create and download the XML file
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workspaceData?.name || 'Financial'}-Report-${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('XML file exported successfully!');
    } catch (error) {
      console.error('Error exporting to XML:', error);
      toast.error('Failed to export XML file');
    } finally {
      setExporting(false);
    }
  };

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown) {
        const target = event.target as Element;
        if (!target.closest('.export-container')) {
          setShowExportDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  return (
    <div className={styles.reportContainer}>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className={styles.reportLayout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.sidebarLogo}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            Financial Report
          </div>
          
          {/* Tab navigation */}
          <div className={styles.tabsList}>
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabItemActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className={styles.tabTitle}>{tab.title}</span>
              </div>
            ))}
            
            {/* Export dropdown with multiple format options */}
            <div className="export-container" style={{ position: 'relative' }}>
              <div 
                className={styles.tabItem}
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                style={{ cursor: 'pointer' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className={styles.tabTitle}>Export Report</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={styles.dropdownIcon}
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    marginLeft: '8px',
                    transform: showExportDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Interactive Dropdown */}
              {showExportDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    minWidth: '200px',
                    animation: 'fadeIn 0.2s ease-out',
                    overflow: 'hidden',
                    marginTop: '8px'
                  }}
                >
                  <style>
                    {`
                      @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                      .dropdown-item {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 12px 16px;
                        border: none;
                        background: none;
                        color: #374151;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: left;
                        border-bottom: 1px solid #f3f4f6;
                      }
                      .dropdown-item:last-child {
                        border-bottom: none;
                      }
                      .dropdown-item:hover {
                        background-color: #f8fafc;
                        color: #1f2937;
                        transform: translateX(2px);
                      }
                      .dropdown-item:active {
                        transform: scale(0.98);
                      }
                      .dropdown-item:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                      }
                      .dropdown-icon {
                        width: 18px;
                        height: 18px;
                        margin-right: 12px;
                        color: #6b7280;
                        transition: color 0.2s ease;
                      }
                      .dropdown-item:hover .dropdown-icon {
                        color: #4f46e5;
                      }
                      .dropdown-item span {
                        font-weight: 500;
                      }
                    `}
                  </style>
                  
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowExportDropdown(false);
                      exportToPdf(false);
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
            
            {/* Email Report option */}
            <div 
              className={styles.tabItem}
              onClick={() => setIsEmailModalOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className={styles.tabTitle}>Email Report</span>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className={styles.mainContent}>
          {/* Back button */}
          <button 
            className={styles.backButton}
            onClick={() => {
              // Navigate back to workspace - data will be restored from session storage
              router.push(`/workspace/${params.id}`);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.backIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Workspace
          </button>
          
          {/* Report header */}
          <div className={styles.reportHeader}>
            <h1 className={styles.reportTitle}>{reportName}</h1>
            <div className={styles.reportMeta}>
              <div className={styles.reportDate}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.dateIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {reportDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
          
          {/* Loading state */}
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Generating financial report...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Unable to Generate Report</h3>
              <p>{error}</p>
              <button 
                className={styles.backButton}
                onClick={() => {
                  // Navigate back to workspace - data will be restored from session storage
                  router.push(`/workspace/${params.id}`);
                }}
              >
                Return to Workspace
              </button>
            </div>
          ) : reportData ? (
            <>
              {/* Executive Summary */}
              {activeTab === 'overview' && (
                <div className={styles.overviewSection}>
                  <div className={styles.summaryCard}>
                    <h3>Executive Summary</h3>
                    <div className={styles.summaryContent}>
                      {cleanText(reportData.summary)}
                    </div>
                  </div>
                  
                  {/* Key Insights */}
                  {reportData.insights && reportData.insights.length > 0 && (
                    <div className={styles.insightsCard}>
                      <h3>Key Insights</h3>
                      <ul className={styles.insightsList}>
                        {cleanTextArray(reportData.insights).map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {reportData.recommendations && reportData.recommendations.length > 0 && (
                    <div className={styles.recommendationsCard}>
                      <h3>Recommendations</h3>
                      <ul className={styles.recommendationsList}>
                        {cleanTextArray(reportData.recommendations).map((recommendation, index) => (
                          <li key={index}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Summary of All Tables */}
                  <div className={styles.tablesOverview}>
                    <h3>Financial Summary Tables</h3>
                    <div className={styles.tableCards}>
                      {reportData.tables.map((table) => (
                        <div 
                          key={table.id} 
                          className={styles.tableCard}
                          onClick={() => setActiveTab(table.id)}
                        >
                          <h4>{table.title}</h4>
                          <p>{table.description}</p>
                          <span className={styles.tableStats}>
                            {table.data.length} rows • {table.columns.length} columns
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Summary tables for specific tabs with detailed analysis */}
              {activeTab !== 'overview' && (
                <div className={styles.summaryTables}>
                  {getVisibleTables().map(table => {
                    const detailedAnalysis = reportData.detailedAnalysis?.[table.id];
                    
                    return (
                      <div key={table.id} className={styles.tableSection} id={table.id}>
                        <h3 className={styles.tableHeader}>{table.title}</h3>
                        <p className={styles.tableDescription}>{table.description}</p>
                        
                        {/* Financial Table */}
                        <div className={styles.tableWrapper}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                {table.columns.map(column => (
                                  <th key={column.accessor} className={column.isNumeric ? styles.number : ''}>
                                    {column.header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.data.map((row, index) => (
                                <tr key={index} className={getRowClass(row)}>
                                  {table.columns.map(column => {
                                    const value = row[column.accessor];
                                    return (
                                      <td 
                                        key={column.accessor}
                                        className={getCellClass(value, column.isNumeric)}
                                      >
                                        {column.isNumeric && column.isCurrency && typeof value === 'number'
                                          ? formatCurrency(value)
                                          : column.isNumeric
                                          ? formatNumber(value)
                                          : value || ''}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Detailed Analysis Section */}
                        {detailedAnalysis && (
                          <div className={styles.detailedAnalysis}>
                            <h4 className={styles.analysisTitle}>
                              📊 Comprehensive Financial Analysis
                            </h4>
                            
                            <div className={styles.analysisGrid}>
                              {/* Business Context */}
                              <div className={styles.analysisSection}>
                                <h5 className={styles.analysisSubtitle}>
                                  Business Context
                                </h5>
                                <p className={styles.analysisText}>{detailedAnalysis.businessContext}</p>
                              </div>
                              
                              {/* Financial Implications */}
                              <div className={styles.analysisSection}>
                                <h5 className={styles.analysisSubtitle}>
                                  Financial Implications
                                </h5>
                                <p className={styles.analysisText}>{detailedAnalysis.financialImplications}</p>
                              </div>
                              
                              {/* Industry Benchmark */}
                              <div className={styles.analysisSection}>
                                <h5 className={styles.analysisSubtitle}>
                                  Industry Benchmark
                                </h5>
                                <p className={styles.analysisText}>{detailedAnalysis.industryBenchmark}</p>
                              </div>
                              
                              {/* Risk Factors */}
                              {detailedAnalysis.riskFactors && detailedAnalysis.riskFactors.length > 0 && (
                                <div className={styles.analysisSection}>
                                  <h5 className={`${styles.analysisSubtitle} ${styles.riskTitle}`}>
                                    Risk Factors
                                  </h5>
                                  <ul className={styles.analysisList}>
                                    {detailedAnalysis.riskFactors.map((risk, index) => (
                                      <li key={index} className={`${styles.analysisListItem} ${styles.riskItem}`}>
                                        {risk}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>📊</div>
              <h3>No Report Data Available</h3>
              <p>Unable to generate financial report from available data.</p>
              <button 
                className={styles.backButton}
                onClick={() => {
                  // Navigate back to workspace - data will be restored from session storage
                  router.push(`/workspace/${params.id}`);
                }}
              >
                Return to Workspace
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSendEmail={handleSendEmail}
        workspaceName={workspaceData?.name}
        fileName={`${workspaceData?.name || 'Financial'}-Report-${new Date().toISOString().split('T')[0]}.pdf`}
        isLoading={isSendingEmail}
      />
    </div>
  );
};

export default ReportPage;
