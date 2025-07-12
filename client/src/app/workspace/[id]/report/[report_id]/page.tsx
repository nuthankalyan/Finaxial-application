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
import { generateSummaryTables, generateMultiFileSummaryTables, type ReportData } from '@/app/services/summaryTableService';
import { buildApiUrl } from '../../../../utils/apiConfig';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

  // Function to generate detailed analysis for a table
  const generateDetailedTableAnalysis = async (
    table: SummaryTable,
    csvContent: string,
    fileName: string
  ): Promise<DetailedTableAnalysis> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
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

Format your response as follows:

BUSINESS CONTEXT:
(Your business context analysis here)

KEY TRENDS:
- Trend 1
- Trend 2
- Trend 3

FINANCIAL IMPLICATIONS:
(Your financial implications analysis here)

RISK FACTORS:
- Risk 1
- Risk 2
- Risk 3

OPPORTUNITIES:
- Opportunity 1
- Opportunity 2
- Opportunity 3

RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
- Recommendation 3

INDUSTRY BENCHMARK:
(Your industry benchmark analysis here)

FORECAST INSIGHTS:
(Your forecast insights here)

Your analysis should be:
- Professional and comprehensive
- Data-driven with specific insights
- Forward-looking and strategic
- Suitable for executive decision-making
- Clear and well-structured
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

      const businessContext = businessContextMatch ? businessContextMatch[1].trim() : 
        'This table provides important financial metrics for business analysis.';
      
      const keyTrends = keyTrendsMatch ? 
        keyTrendsMatch[1]
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .slice(0, 5) : 
        ['Data analysis reveals important patterns and trends.'];
      
      const financialImplications = financialImplicationsMatch ? financialImplicationsMatch[1].trim() : 
        'The data indicates important financial implications for business strategy.';
      
      const riskFactors = riskFactorsMatch ? 
        riskFactorsMatch[1]
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .slice(0, 4) : 
        ['Consider potential risks in financial planning.'];
      
      const opportunities = opportunitiesMatch ? 
        opportunitiesMatch[1]
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .slice(0, 4) : 
        ['Identify growth opportunities in the data.'];
      
      const recommendations = recommendationsMatch ? 
        recommendationsMatch[1]
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .slice(0, 5) : 
        ['Develop strategic recommendations based on analysis.'];
      
      const industryBenchmark = industryBenchmarkMatch ? industryBenchmarkMatch[1].trim() : 
        'Compare performance against industry standards and benchmarks.';
      
      const forecastInsights = forecastInsightsMatch ? forecastInsightsMatch[1].trim() : 
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

        // Check if workspace has datasets with data
        if (!workspace.datasets || workspace.datasets.length === 0) {
          setError('No datasets found in this workspace. Please upload financial data first.');
          return;
        }

        // Get the latest version of each dataset
        const latestDatasets = workspace.datasets.map((dataset: any) => {
          const latestVersion = dataset.versions[dataset.versions.length - 1];
          return {
            content: latestVersion.content,
            fileName: latestVersion.fileName,
            type: latestVersion.type
          };
        });

        // Process CSV content (for Excel files, extract primary sheet)
        const csvFiles = latestDatasets.map((dataset: any) => {
          let content = dataset.content;
          
          // If it's Excel data (stored as JSON), extract CSV content
          if (dataset.type === 'excel') {
            try {
              const excelData = JSON.parse(content);
              // Convert the primary sheet to CSV format
              const primarySheetData = excelData.sheets[excelData.primarySheet];
              const headers = primarySheetData.headers;
              const rows = primarySheetData.rows;
              
              content = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
            } catch (e) {
              console.warn('Failed to parse Excel data, using raw content');
            }
          }
          
          return {
            content,
            fileName: dataset.fileName
          };
        });

        // Generate summary tables using Gemini AI
        let reportData: ReportData;
        
        if (csvFiles.length === 1) {
          reportData = await generateSummaryTables(csvFiles[0].content, csvFiles[0].fileName);
        } else {
          reportData = await generateMultiFileSummaryTables(csvFiles);
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

        // Optional: Save the generated report data to the server for future access
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
                reportData,
                generatedAt: new Date().toISOString(),
                workspaceName: workspace.name
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
  // Function to export the report as PDF
  const exportToPdf = () => {
    if (!reportData) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(reportName, 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${reportDate.toLocaleDateString()}`, 20, 30);
    
    let yPos = 40;
    
    // Add executive summary if available
    if (reportData.summary) {
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(reportData.summary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 5 + 10;
    }
    
    // Add each table with detailed analysis
    reportData.tables.forEach(table => {
      // Check if we need to add a new page
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add section title
      doc.setFontSize(16);
      doc.text(table.title, 20, yPos);
      yPos += 10;
      
      // Add description
      doc.setFontSize(10);
      doc.text(table.description, 20, yPos);
      yPos += 15;
      
      // Prepare table data
      const headers = table.columns.map(col => col.header);
      const data = table.data.map(row => 
        table.columns.map(col => {
          const value = row[col.accessor];
          if (col.isNumeric && col.isCurrency && typeof value === 'number') {
            return formatCurrency(value);
          } else if (col.isNumeric && typeof value === 'number') {
            return formatNumber(value);
          }
          return value || '';
        })
      );
      
      // Add table
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: yPos,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
        didDrawPage: () => {},
      });
      
      // Update position for next content
      yPos = (doc as any).lastAutoTable.finalY + 20;
      
      // Add detailed analysis if available
      const detailedAnalysis = reportData.detailedAnalysis?.[table.id];
      if (detailedAnalysis) {
        // Check if we need a new page for analysis
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        
        // Business Context
        doc.setFontSize(12);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text('Business Context:', 20, yPos);
        yPos += 8;
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'normal');
        const contextLines = doc.splitTextToSize(detailedAnalysis.businessContext, 170);
        doc.text(contextLines, 20, yPos);
        yPos += contextLines.length * 4 + 10;
        
        // Key Trends
        if (detailedAnalysis.keyTrends && detailedAnalysis.keyTrends.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(33, 37, 41);
          doc.setFont('helvetica', 'bold');
          doc.text('Key Trends:', 20, yPos);
          yPos += 8;
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.setFont('helvetica', 'normal');
          detailedAnalysis.keyTrends.forEach(trend => {
            const trendLines = doc.splitTextToSize(`• ${trend}`, 160);
            doc.text(trendLines, 25, yPos);
            yPos += trendLines.length * 4 + 2;
          });
          yPos += 5;
        }
        
        // Financial Implications
        doc.setFontSize(11);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Implications:', 20, yPos);
        yPos += 8;
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'normal');
        const implicationsLines = doc.splitTextToSize(detailedAnalysis.financialImplications, 170);
        doc.text(implicationsLines, 20, yPos);
        yPos += implicationsLines.length * 4 + 10;
        
        // Risk Factors
        if (detailedAnalysis.riskFactors && detailedAnalysis.riskFactors.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(220, 53, 69);
          doc.setFont('helvetica', 'bold');
          doc.text('Risk Factors:', 20, yPos);
          yPos += 8;
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.setFont('helvetica', 'normal');
          detailedAnalysis.riskFactors.forEach(risk => {
            const riskLines = doc.splitTextToSize(`• ${risk}`, 160);
            doc.text(riskLines, 25, yPos);
            yPos += riskLines.length * 4 + 2;
          });
          yPos += 5;
        }
        
        // Opportunities
        if (detailedAnalysis.opportunities && detailedAnalysis.opportunities.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(40, 167, 69);
          doc.setFont('helvetica', 'bold');
          doc.text('Opportunities:', 20, yPos);
          yPos += 8;
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.setFont('helvetica', 'normal');
          detailedAnalysis.opportunities.forEach(opportunity => {
            const opportunityLines = doc.splitTextToSize(`• ${opportunity}`, 160);
            doc.text(opportunityLines, 25, yPos);
            yPos += opportunityLines.length * 4 + 2;
          });
          yPos += 5;
        }
        
        // Recommendations
        if (detailedAnalysis.recommendations && detailedAnalysis.recommendations.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(33, 37, 41);
          doc.setFont('helvetica', 'bold');
          doc.text('Strategic Recommendations:', 20, yPos);
          yPos += 8;
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.setFont('helvetica', 'normal');
          detailedAnalysis.recommendations.forEach(recommendation => {
            const recommendationLines = doc.splitTextToSize(`• ${recommendation}`, 160);
            doc.text(recommendationLines, 25, yPos);
            yPos += recommendationLines.length * 4 + 2;
          });
          yPos += 5;
        }
        
        // Industry Benchmark
        doc.setFontSize(11);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text('Industry Benchmark:', 20, yPos);
        yPos += 8;
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'normal');
        const benchmarkLines = doc.splitTextToSize(detailedAnalysis.industryBenchmark, 170);
        doc.text(benchmarkLines, 20, yPos);
        yPos += benchmarkLines.length * 4 + 10;
        
        // Forecast Insights
        doc.setFontSize(11);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text('Forecast Insights:', 20, yPos);
        yPos += 8;
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'normal');
        const forecastLines = doc.splitTextToSize(detailedAnalysis.forecastInsights, 170);
        doc.text(forecastLines, 20, yPos);
        yPos += forecastLines.length * 4 + 10;
      }
    });
    
    // Save the PDF
    doc.save(`${reportName.replace(/\s+/g, '_')}.pdf`);
  };

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
            
            {/* Export to PDF option */}
            <div 
              className={styles.tabItem}
              onClick={exportToPdf}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className={styles.tabTitle}>Export PDF</span>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className={styles.mainContent}>
          {/* Back button */}
          <button 
            className={styles.backButton}
            onClick={() => router.push(`/workspace/${params.id}`)}
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
                onClick={() => router.push(`/workspace/${params.id}`)}
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
                      {reportData.summary}
                    </div>
                  </div>
                  
                  {/* Key Insights */}
                  {reportData.insights && reportData.insights.length > 0 && (
                    <div className={styles.insightsCard}>
                      <h3>Key Insights</h3>
                      <ul className={styles.insightsList}>
                        {reportData.insights.map((insight, index) => (
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
                        {reportData.recommendations.map((recommendation, index) => (
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
                            <h4 className={styles.analysisTitle}>Comprehensive Financial Analysis</h4>
                            
                            {/* Business Context */}
                            <div className={styles.analysisSection}>
                              <h5 className={styles.analysisSubtitle}>Business Context</h5>
                              <p className={styles.analysisText}>{detailedAnalysis.businessContext}</p>
                            </div>
                            
                            {/* Key Trends */}
                            {detailedAnalysis.keyTrends && detailedAnalysis.keyTrends.length > 0 && (
                              <div className={styles.analysisSection}>
                                <h5 className={styles.analysisSubtitle}>Key Trends</h5>
                                <ul className={styles.analysisList}>
                                  {detailedAnalysis.keyTrends.map((trend, index) => (
                                    <li key={index} className={styles.analysisListItem}>{trend}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Financial Implications */}
                            <div className={styles.analysisSection}>
                              <h5 className={styles.analysisSubtitle}>Financial Implications</h5>
                              <p className={styles.analysisText}>{detailedAnalysis.financialImplications}</p>
                            </div>
                            
                            {/* Risk Factors */}
                            {detailedAnalysis.riskFactors && detailedAnalysis.riskFactors.length > 0 && (
                              <div className={styles.analysisSection}>
                                <h5 className={`${styles.analysisSubtitle} ${styles.riskTitle}`}>Risk Factors</h5>
                                <ul className={styles.analysisList}>
                                  {detailedAnalysis.riskFactors.map((risk, index) => (
                                    <li key={index} className={`${styles.analysisListItem} ${styles.riskItem}`}>{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Opportunities */}
                            {detailedAnalysis.opportunities && detailedAnalysis.opportunities.length > 0 && (
                              <div className={styles.analysisSection}>
                                <h5 className={`${styles.analysisSubtitle} ${styles.opportunityTitle}`}>Opportunities</h5>
                                <ul className={styles.analysisList}>
                                  {detailedAnalysis.opportunities.map((opportunity, index) => (
                                    <li key={index} className={`${styles.analysisListItem} ${styles.opportunityItem}`}>{opportunity}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Recommendations */}
                            {detailedAnalysis.recommendations && detailedAnalysis.recommendations.length > 0 && (
                              <div className={styles.analysisSection}>
                                <h5 className={styles.analysisSubtitle}>Strategic Recommendations</h5>
                                <ul className={styles.analysisList}>
                                  {detailedAnalysis.recommendations.map((recommendation, index) => (
                                    <li key={index} className={styles.analysisListItem}>{recommendation}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Industry Benchmark */}
                            <div className={styles.analysisSection}>
                              <h5 className={styles.analysisSubtitle}>Industry Benchmark</h5>
                              <p className={styles.analysisText}>{detailedAnalysis.industryBenchmark}</p>
                            </div>
                            
                            {/* Forecast Insights */}
                            <div className={styles.analysisSection}>
                              <h5 className={styles.analysisSubtitle}>Forecast Insights</h5>
                              <p className={styles.analysisText}>{detailedAnalysis.forecastInsights}</p>
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
                onClick={() => router.push(`/workspace/${params.id}`)}
              >
                Return to Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
