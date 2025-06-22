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

const ReportPage: React.FC<ReportPageProps> = ({ params }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('cashflow');
  const [summaryTables, setSummaryTables] = useState<SummaryTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reportName, setReportName] = useState<string>('Financial Report');
  const [reportDate, setReportDate] = useState<Date>(new Date());

  // Load sample data on mount
  useEffect(() => {
    setIsLoading(true);
    generateSampleData();
    setIsLoading(false);
  }, []);

  // Function to generate sample data
  const generateSampleData = () => {
    // Sample Cash Flow table
    const cashFlowTable: SummaryTable = {
      id: 'cashflow',
      title: 'Cash Flow Statement',
      description: 'Summary of cash inflows and outflows for the period',
      columns: [
        { header: 'Category', accessor: 'category' },
        { header: 'Amount (₹)', accessor: 'amount', isNumeric: true, isCurrency: true }
      ],
      data: [
        { category: 'Cash Flow from Operating Activities', amount: 547830000 },
        { category: 'Cash Flow from Investing Activities', amount: -170710000 },
        { category: 'Cash Flow from Financing Activities', amount: -147420000 },
        { category: 'Net Change in Cash and Cash Equivalents', amount: 229700000, isTotal: true },
      ]
    };
    
    // Sample Profit & Loss table
    const profitLossTable: SummaryTable = {
      id: 'profit-loss',
      title: 'Profit & Loss Statement',
      description: 'Summary of revenue, expenses and profit for the period',
      columns: [
        { header: 'Category', accessor: 'category' },
        { header: 'Amount (₹)', accessor: 'amount', isNumeric: true, isCurrency: true }
      ],
      data: [
        { category: 'Revenue from Operations', amount: 541620000 },
        { category: 'Other Income', amount: 51720000 },
        { category: 'Total Revenue', amount: 593340000, isSubTotal: true },
        { category: 'Cost of Materials Consumed', amount: -112640000 },
        { category: 'Employee Benefits Expense', amount: -116050000 },
        { category: 'Other Expenses', amount: -140270000 },
        { category: 'Total Expenses', amount: -368960000, isSubTotal: true },
        { category: 'Profit Before Tax', amount: 224380000 },
        { category: 'Tax Expense', amount: -53350000 },
        { category: 'Net Profit After Tax', amount: 171030000, isTotal: true },
      ]
    };
    
    // Sample Balance Sheet table
    const balanceSheetTable: SummaryTable = {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Summary of assets, liabilities and equity',
      columns: [
        { header: 'Category', accessor: 'category' },
        { header: 'Amount (₹)', accessor: 'amount', isNumeric: true, isCurrency: true }
      ],
      data: [
        { category: 'ASSETS', amount: null, isHeader: true },
        { category: 'Non-current Assets', amount: 270360000 },
        { category: 'Current Assets', amount: 1072700000 },
        { category: 'Total Assets', amount: 1343060000, isSubTotal: true },
        { category: 'LIABILITIES', amount: null, isHeader: true },
        { category: 'Non-current Liabilities', amount: 7000000 },
        { category: 'Current Liabilities', amount: 244410000 },
        { category: 'Total Liabilities', amount: 251410000, isSubTotal: true },
        { category: 'EQUITY', amount: null, isHeader: true },
        { category: 'Share Capital', amount: 306540000 },
        { category: 'Other Equity', amount: 785110000 },
        { category: 'Total Equity', amount: 1091650000, isSubTotal: true },
        { category: 'Total Liabilities and Equity', amount: 1343060000, isTotal: true },
      ]
    };
    
    // Sample Key Ratios table
    const keyRatiosTable: SummaryTable = {
      id: 'key-ratios',
      title: 'Key Financial Ratios',
      description: 'Important financial ratios derived from the financial statements',
      columns: [
        { header: 'Ratio', accessor: 'ratio' },
        { header: 'Value', accessor: 'value', isNumeric: true }
      ],
      data: [
        { ratio: 'Current Ratio', value: '4.39' },
        { ratio: 'Quick Ratio', value: '4.28' },
        { ratio: 'Debt to Equity', value: '0.23' },
        { ratio: 'Return on Equity (ROE)', value: '15.67%' },
        { ratio: 'Return on Assets (ROA)', value: '12.73%' },
        { ratio: 'Profit Margin', value: '31.58%' },
        { ratio: 'EBITDA Margin', value: '43.66%' },
      ]
    };
    
    setSummaryTables([cashFlowTable, profitLossTable, balanceSheetTable, keyRatiosTable]);
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
  
  // Define sidebar tabs based on available summary tables
  const tabs: TabItem[] = [
    {
      id: 'cashflow',
      title: 'Cash Flow',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tableRefs: ['cashflow']
    },
    {
      id: 'profit-loss',
      title: 'Profit & Loss',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      tableRefs: ['profit-loss']
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      tableRefs: ['balance-sheet']
    },
    {
      id: 'key-ratios',
      title: 'Key Ratios',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.tabIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      ),
      tableRefs: ['key-ratios']
    }
  ];

  // Function to filter tables based on active tab
  const getVisibleTables = (): SummaryTable[] => {
    const activeTabItem = tabs.find(tab => tab.id === activeTab);
    if (!activeTabItem) return summaryTables;
    
    return summaryTables.filter(table => 
      activeTabItem.tableRefs.includes(table.id)
    );
  };

  // Function to export the report as PDF
  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(reportName, 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${reportDate.toLocaleDateString()}`, 20, 30);
    
    let yPos = 40;
    
    // Add each table
    summaryTables.forEach(table => {
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
              <p>Loading report data...</p>
            </div>
          ) : (
            /* Summary tables */
            <div className={styles.summaryTables}>
              {getVisibleTables().map(table => (
                <div key={table.id} className={styles.tableSection} id={table.id}>
                  <h3 className={styles.tableHeader}>{table.title}</h3>
                  <p className={styles.tableDescription}>{table.description}</p>
                  
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
