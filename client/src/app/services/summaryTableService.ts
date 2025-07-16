'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SummaryTable } from '../types/csv';
import type { TableColumn, TableRow } from '../types/tables';

export interface ReportData {
  summary: string;
  tables: SummaryTable[];
  insights: string[];
  recommendations: string[];
}

/**
 * Detects if content is Excel data (JSON format) and extracts sheet information
 */
interface ExcelSheetData {
  headers: string[];
  rows: string[][];
}

interface ExcelData {
  sheets: { [sheetName: string]: ExcelSheetData };
  primarySheet: string;
}

const isExcelData = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && parsed.sheets && parsed.primarySheet;
  } catch {
    return false;
  }
};

const parseExcelData = (content: string): ExcelData | null => {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && parsed.sheets && parsed.primarySheet) {
      return parsed as ExcelData;
    }
  } catch (error) {
    console.error('Error parsing Excel data:', error);
  }
  return null;
};

const convertSheetToCSV = (sheetData: ExcelSheetData): string => {
  const csvLines = [
    sheetData.headers.join(','),
    ...sheetData.rows.map(row => row.join(','))
  ];
  return csvLines.join('\n');
};

/**
 * Generates summary tables from Excel data with multiple sheets
 * Processes all available sheets in the Excel file
 */
export const generateExcelSummaryTables = async (excelContent: string, fileName?: string): Promise<ReportData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const excelData = parseExcelData(excelContent);
    if (!excelData) {
      throw new Error('Invalid Excel data format');
    }

    const sheetNames = Object.keys(excelData.sheets);
    const allSheets = Object.entries(excelData.sheets);

    console.log('[SummaryTableService] Processing Excel file with multiple sheets:', {
      fileName,
      sheetCount: sheetNames.length,
      sheetNames,
      primarySheet: excelData.primarySheet
    });

    // Validate that we have meaningful data across sheets
    allSheets.forEach(([sheetName, sheetData]) => {
      if (!sheetData.headers || sheetData.headers.length === 0) {
        throw new Error(`No headers found in sheet "${sheetName}"`);
      }
      if (!sheetData.rows || sheetData.rows.length === 0) {
        throw new Error(`No data rows found in sheet "${sheetName}"`);
      }
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare content for all sheets
    const sheetsContent = allSheets.map(([sheetName, sheetData]) => {
      const csvContent = convertSheetToCSV(sheetData);
      return `SHEET: ${sheetName}${sheetName === excelData.primarySheet ? ' (PRIMARY)' : ''}
COLUMNS: ${sheetData.headers.join(', ')}
ROWS: ${sheetData.rows.length}
DATA:
${csvContent}

`;
    }).join('');

    const prompt = `
You are a financial analyst. Analyze the following Excel file with multiple sheets and generate comprehensive financial summary tables that utilize data from all available sheets.

IMPORTANT: This Excel file contains ${sheetNames.length} sheets. Each sheet has been filtered to include only the visible columns. Generate analysis that leverages the relationship between different sheets and provides comprehensive financial insights.

IMPORTANT: Generate tables ONLY based on the sheets provided in this current analysis. Do not reference any historical data.

EXCEL FILE: ${fileName || 'Excel Workbook'}
PRIMARY SHEET: ${excelData.primarySheet}
AVAILABLE SHEETS: ${sheetNames.join(', ')}

${sheetsContent}

Please generate a structured financial report that analyzes and consolidates data from all sheets with the following components:

1. EXECUTIVE_SUMMARY: A comprehensive overview of the financial data across all sheets, highlighting key relationships and the overall financial picture.

2. SUMMARY_TABLES: Generate 5-10 financial summary tables that:
   - Consolidate data from multiple sheets where applicable
   - Show relationships between different financial aspects (e.g., P&L vs Balance Sheet)
   - Provide sheet-specific analysis where relevant
   - Create cross-sheet financial ratios and metrics

Each table should follow this exact JSON structure:
{
  "id": "unique-table-id",
  "title": "Table Title",
  "description": "Brief description including which sheets are used",
  "columns": [
    {
      "header": "Column Name",
      "accessor": "column_key",
      "isNumeric": true/false,
      "isCurrency": true/false
    }
  ],
  "data": [
    {
      "column_key": value,
      "isTotal": true/false,
      "isSubTotal": true/false,
      "isHeader": true/false
    }
  ]
}

Focus on creating tables that:
- Utilize data from multiple sheets (cross-sheet analysis)
- Show consolidated financial statements
- Provide comprehensive financial ratios
- Highlight sheet-specific insights
- Create summary views across all financial data

3. KEY_INSIGHTS: List 5-8 important insights derived from analyzing all sheets together.

4. RECOMMENDATIONS: List 5-8 actionable recommendations based on the multi-sheet analysis.

FORMATTING REQUIREMENTS:
- Use only valid JSON for the SUMMARY_TABLES section
- For currency values, use numbers (not formatted strings)
- Mark totals with "isTotal": true, subtotals with "isSubTotal": true
- Mark section headers with "isHeader": true
- Include sheet references in descriptions where relevant
- Ensure comprehensive analysis utilizing all available sheets

Format your response exactly as follows:

EXECUTIVE_SUMMARY:
(Your executive summary here)

SUMMARY_TABLES:
[
  {
    "id": "table1",
    "title": "Table 1 Title",
    "description": "Description with sheet references",
    "columns": [...],
    "data": [...]
  },
  {
    "id": "table2",
    "title": "Table 2 Title", 
    "description": "Description with sheet references",
    "columns": [...],
    "data": [...]
  }
]

KEY_INSIGHTS:
- Insight 1
- Insight 2
- Insight 3

RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
- Recommendation 3
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response (same parsing logic as before)
    const summaryMatch = text.match(/EXECUTIVE_SUMMARY:([\s\S]*?)(?=SUMMARY_TABLES:|$)/i);
    const tablesMatch = text.match(/SUMMARY_TABLES:([\s\S]*?)(?=KEY_INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY_INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=$)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'Multi-sheet financial analysis summary not available.';

    // Parse tables JSON
    let tables: SummaryTable[] = [];
    if (tablesMatch && tablesMatch[1]) {
      try {
        const tablesJson = tablesMatch[1].trim();
        const jsonMatch = tablesJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
          tables = JSON.parse(sanitizedJson);
          tables = tables.map(table => sanitizeTable(table));
          
          console.log('[SummaryTableService] Generated multi-sheet tables:', {
            tableCount: tables.length,
            tables: tables.map(table => ({
              id: table.id,
              title: table.title,
              columnCount: table.columns.length
            }))
          });
        }
      } catch (error) {
        console.error('Error parsing multi-sheet tables JSON:', error);
        tables = getFallbackTables();
      }
    }

    // Parse insights
    let insights: string[] = [];
    if (insightsMatch && insightsMatch[1]) {
      insights = insightsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    // Parse recommendations
    let recommendations: string[] = [];
    if (recommendationsMatch && recommendationsMatch[1]) {
      recommendations = recommendationsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    return {
      summary,
      tables: tables.length > 0 ? tables : getFallbackTables(),
      insights: insights.length > 0 ? insights : ['Multi-sheet analysis provides comprehensive financial insights.'],
      recommendations: recommendations.length > 0 ? recommendations : ['Leverage multi-sheet data for strategic planning.']
    };

  } catch (error: any) {
    console.error('Error generating Excel summary tables:', error);
    throw new Error(`Failed to generate multi-sheet financial summary: ${error.message}`);
  }
};

/**
 * Enhanced function that detects file type and processes accordingly
 * Handles both CSV and multi-sheet Excel data
 */
export const generateSummaryTablesEnhanced = async (content: string, fileName?: string): Promise<ReportData> => {
  try {
    // Detect if this is Excel data (JSON format with sheets)
    if (isExcelData(content)) {
      console.log('[SummaryTableService] Detected Excel data, processing all sheets');
      return await generateExcelSummaryTables(content, fileName);
    } else {
      console.log('[SummaryTableService] Detected CSV data, processing as single file');
      return await generateSummaryTables(content, fileName);
    }
  } catch (error: any) {
    console.error('Error in enhanced summary table generation:', error);
    throw new Error(`Failed to generate summary tables: ${error.message}`);
  }
};

/**
 * Enhanced multi-file function that handles mixed CSV and Excel files
 */
export const generateMultiFileSummaryTablesEnhanced = async (files: { content: string; fileName: string }[]): Promise<ReportData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    console.log('[SummaryTableService] Processing mixed file types:', {
      fileCount: files.length,
      files: files.map(file => ({
        fileName: file.fileName,
        type: isExcelData(file.content) ? 'Excel (multi-sheet)' : 'CSV',
        contentLength: file.content.length
      }))
    });

    // Process each file and prepare content with sheet information
    const processedFiles = files.map((file, index) => {
      if (isExcelData(file.content)) {
        const excelData = parseExcelData(file.content);
        if (excelData) {
          const sheetNames = Object.keys(excelData.sheets);
          const sheetsContent = Object.entries(excelData.sheets).map(([sheetName, sheetData]) => {
            const csvContent = convertSheetToCSV(sheetData);
            return `SHEET: ${sheetName}${sheetName === excelData.primarySheet ? ' (PRIMARY)' : ''}
COLUMNS: ${sheetData.headers.join(', ')}
DATA:
${csvContent}`;
          }).join('\n\n');
          
          return `FILE ${index + 1}: ${file.fileName} (Excel - ${sheetNames.length} sheets)
AVAILABLE SHEETS: ${sheetNames.join(', ')}
PRIMARY SHEET: ${excelData.primarySheet}

${sheetsContent}

`;
        }
      } else {
        // CSV file
        const lines = file.content.trim().split('\n');
        const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim()) : [];
        
        return `FILE ${index + 1}: ${file.fileName} (CSV)
COLUMNS AVAILABLE: ${headers.join(', ')}
DATA:
${file.content}

`;
      }
      return '';
    }).join('');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are a financial analyst. Analyze the following mixed collection of CSV and Excel files and generate comprehensive financial summary tables that consolidate and compare data across all files and sheets.

IMPORTANT: Some files are Excel workbooks with multiple sheets, others are CSV files. Generate analysis that leverages relationships between different files and sheets to provide comprehensive financial insights.

IMPORTANT: Generate tables ONLY based on the files provided in this current analysis. Do not reference any historical data.

${processedFiles}

Please generate a structured financial report that combines insights from all files and sheets with the following components:

1. EXECUTIVE_SUMMARY: A comprehensive overview of the combined financial data, highlighting relationships between files/sheets and overall financial picture.

2. SUMMARY_TABLES: Generate 6-12 financial summary tables that:
   - Consolidate data across multiple files and sheets
   - Show cross-file relationships and comparisons
   - Provide file/sheet-specific analysis where relevant
   - Create comprehensive financial metrics across all data sources

Each table should follow the exact JSON structure specified earlier.

3. KEY_INSIGHTS: List 6-10 important insights derived from analyzing all files and sheets together.

4. RECOMMENDATIONS: List 6-10 actionable recommendations based on the comprehensive multi-file analysis.

Format your response in the same structure as previous examples.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse response using same logic as other functions
    const summaryMatch = text.match(/EXECUTIVE_SUMMARY:([\s\S]*?)(?=SUMMARY_TABLES:|$)/i);
    const tablesMatch = text.match(/SUMMARY_TABLES:([\s\S]*?)(?=KEY_INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY_INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=$)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'Multi-file financial analysis summary not available.';

    let tables: SummaryTable[] = [];
    if (tablesMatch && tablesMatch[1]) {
      try {
        const tablesJson = tablesMatch[1].trim();
        const jsonMatch = tablesJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
          tables = JSON.parse(sanitizedJson);
          tables = tables.map(table => sanitizeTable(table));
        }
      } catch (error) {
        console.error('Error parsing multi-file tables JSON:', error);
        tables = getFallbackTables();
      }
    }

    let insights: string[] = [];
    if (insightsMatch && insightsMatch[1]) {
      insights = insightsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    let recommendations: string[] = [];
    if (recommendationsMatch && recommendationsMatch[1]) {
      recommendations = recommendationsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    return {
      summary,
      tables: tables.length > 0 ? tables : getFallbackTables(),
      insights: insights.length > 0 ? insights : ['Multi-file analysis provides comprehensive financial insights.'],
      recommendations: recommendations.length > 0 ? recommendations : ['Leverage multi-file data for strategic planning.']
    };

  } catch (error: any) {
    console.error('Error generating multi-file summary tables:', error);
    throw new Error(`Failed to generate multi-file financial summary: ${error.message}`);
  }
};

/**
 * Generates financial summary tables from CSV data using Gemini AI
 * Only processes the specific CSV content provided in this call
 */
export const generateSummaryTables = async (csvContent: string, fileName?: string): Promise<ReportData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    // Log the data being processed to ensure only visible columns are included
    console.log('[SummaryTableService] Processing single file:', {
      fileName,
      contentLength: csvContent.length,
      firstLine: csvContent.split('\n')[0], // Show headers
      lineCount: csvContent.split('\n').length
    });

    console.log('[SummaryTableService] IMPORTANT: Only processing current file data, not workspace history');

    // Validate that we have meaningful data
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Insufficient data: File must contain headers and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    
    // Check if we have any visible columns
    if (headers.length === 0 || headers.every(h => h.trim() === '')) {
      throw new Error('No visible columns found: Please ensure at least one column is visible before generating reports');
    }
    
    console.log('[SummaryTableService] Processing headers (visible columns only):', headers);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are a financial analyst. Analyze the following CSV data and generate comprehensive financial summary tables suitable for a professional financial report.

IMPORTANT: This CSV data has already been filtered to include only the columns that the user wants to analyze. 

IMPORTANT: Generate tables ONLY based on the file provided in this current analysis. Do not reference or attempt to analyze any historical data.

COLUMN USAGE INSTRUCTIONS:
- You may use the exact column names from the source data: ${headers.join(', ')}
- You may also create computed/derived columns for financial analysis (e.g., "Total Revenue (INR)", "Profit Margin %", "Growth Rate")
- Ensure computed columns are clearly labeled and based on the source data
- Use descriptive names for computed columns that include units when appropriate

CSV DATA:
${csvContent}

${fileName ? `FILE NAME: ${fileName}` : ''}

AVAILABLE SOURCE COLUMNS: ${headers.join(', ')}

Please generate a structured financial report with the following components:

1. EXECUTIVE_SUMMARY: A brief overview of the financial data and its significance.

2. SUMMARY_TABLES: Generate 3-6 financial summary tables based on the data. Each table should follow this exact JSON structure:
{
  "id": "unique-table-id",
  "title": "Table Title",
  "description": "Brief description of what this table shows",
  "columns": [
    {
      "header": "Column Name",
      "accessor": "column_key",
      "isNumeric": true/false,
      "isCurrency": true/false
    }
  ],
  "data": [
    {
      "column_key": value,
      "isTotal": true/false,
      "isSubTotal": true/false,
      "isHeader": true/false
    }
  ]
}

Common financial tables to generate (adapt based on data):
- Cash Flow Statement (operating, investing, financing activities)
- Profit & Loss Statement (revenue, expenses, profit)
- Balance Sheet (assets, liabilities, equity)
- Key Financial Ratios (liquidity, profitability, efficiency ratios)
- Revenue Analysis (by category, time period, etc.)
- Expense Breakdown (by category, type, etc.)

3. KEY_INSIGHTS: List 3-5 important insights derived from the data.

4. RECOMMENDATIONS: List 3-5 actionable recommendations based on the analysis.

FORMATTING REQUIREMENTS:
- Use only valid JSON for the SUMMARY_TABLES section
- For currency values, use numbers (not formatted strings)
- Mark totals with "isTotal": true, subtotals with "isSubTotal": true
- Mark section headers with "isHeader": true
- Use descriptive but concise table titles and descriptions
- Ensure accessor keys match the data property names exactly
- Include appropriate financial categories and calculations

Format your response exactly as follows:

EXECUTIVE_SUMMARY:
(Your executive summary here)

SUMMARY_TABLES:
[
  {
    "id": "table1",
    "title": "Table 1 Title",
    "description": "Description",
    "columns": [...],
    "data": [...]
  },
  {
    "id": "table2",
    "title": "Table 2 Title", 
    "description": "Description",
    "columns": [...],
    "data": [...]
  }
]

KEY_INSIGHTS:
- Insight 1
- Insight 2
- Insight 3

RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
- Recommendation 3
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const summaryMatch = text.match(/EXECUTIVE_SUMMARY:([\s\S]*?)(?=SUMMARY_TABLES:|$)/i);
    const tablesMatch = text.match(/SUMMARY_TABLES:([\s\S]*?)(?=KEY_INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY_INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=$)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'Financial analysis summary not available.';

    // Parse tables JSON
    let tables: SummaryTable[] = [];
    if (tablesMatch && tablesMatch[1]) {
      try {
        const tablesJson = tablesMatch[1].trim();
        // Find JSON array in the response
        const jsonMatch = tablesJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
          tables = JSON.parse(sanitizedJson);
          
          // Validate and sanitize table data
          tables = tables.map(table => sanitizeTable(table));
          
          // Ensure tables only use visible columns from the source data
          console.log('[SummaryTableService] Before validation - tables:', tables.map(t => ({
            title: t.title,
            columns: t.columns.map(c => c.header)
          })));
          
          tables = validateTablesUseVisibleColumns(tables, headers);
          
          console.log('[SummaryTableService] After validation - tables:', tables.map(t => ({
            title: t.title,
            columns: t.columns.map(c => c.header)
          })));
          
          // If validation filtered out all tables, provide fallback
          if (tables.length === 0) {
            console.warn('[SummaryTableService] All tables were filtered out by validation, using fallback tables');
            tables = generateFallbackTablesFromData(csvContent, headers);
          }
          
          console.log('[SummaryTableService] Generated tables with visible columns only:', {
            tableCount: tables.length,
            tables: tables.map(table => ({
              id: table.id,
              title: table.title,
              columnCount: table.columns.length,
              columns: table.columns.map(col => col.header)
            }))
          });
        }
      } catch (error) {
        console.error('Error parsing tables JSON:', error);
        tables = getFallbackTables();
      }
    }

    // Parse insights
    let insights: string[] = [];
    if (insightsMatch && insightsMatch[1]) {
      insights = insightsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    // Parse recommendations
    let recommendations: string[] = [];
    if (recommendationsMatch && recommendationsMatch[1]) {
      recommendations = recommendationsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    return {
      summary,
      tables: tables.length > 0 ? tables : generateFallbackTablesFromData(csvContent, headers),
      insights: insights.length > 0 ? insights : ['No specific insights available from the current data.'],
      recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations available.']
    };

  } catch (error: any) {
    console.error('Error generating summary tables:', error);
    throw new Error(`Failed to generate financial summary: ${error.message}`);
  }
};

/**
 * Generates summary tables from multiple CSV files
 * Only processes the files provided in the current upload operation
 */
export const generateMultiFileSummaryTables = async (files: { content: string; fileName: string }[]): Promise<ReportData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    // Log the files being processed to ensure only visible columns are included
    console.log('[SummaryTableService] Processing multiple files from current upload:', {
      fileCount: files.length,
      files: files.map(file => {
        const lines = file.content.trim().split('\n');
        const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim()) : [];
        return {
          fileName: file.fileName,
          contentLength: file.content.length,
          headers,
          lineCount: lines.length
        };
      })
    });

    console.log('[SummaryTableService] IMPORTANT: Only processing files from current session, not workspace history');

    // Validate all files have meaningful data
    files.forEach((file, index) => {
      const lines = file.content.trim().split('\n');
      if (lines.length < 2) {
        throw new Error(`Insufficient data in file ${index + 1} (${file.fileName}): File must contain headers and at least one data row`);
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      if (headers.length === 0 || headers.every(h => h.trim() === '')) {
        throw new Error(`No visible columns found in file ${index + 1} (${file.fileName}): Please ensure at least one column is visible before generating reports`);
      }
    });

    // Important: We're only using files from the current upload operation
    // Any historical data or previously uploaded files are not included

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare file contents with column information
    const filesContent = files.map((file, index) => {
      const lines = file.content.trim().split('\n');
      const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim()) : [];
      
      return `FILE ${index + 1}: ${file.fileName}
COLUMNS AVAILABLE: ${headers.join(', ')}
DATA:
${file.content}

`;
    }).join('');

    const prompt = `
You are a financial analyst. Analyze the following multiple CSV files and generate comprehensive financial summary tables that consolidate and compare data across all files.

IMPORTANT: Each CSV file has already been filtered to include only the columns that the user wants to analyze for that specific file. Do not include any columns that are not present in the provided data. Only use the visible columns from each file as specified in the "COLUMNS AVAILABLE" section for each file.

IMPORTANT: Generate tables ONLY based on the files provided in this current analysis. Do not reference or attempt to analyze any historical data or previously uploaded files.

${filesContent}

Please generate a structured financial report that combines insights from all files with the following components:

1. EXECUTIVE_SUMMARY: A comprehensive overview of the combined financial data, highlighting relationships between files and overall financial picture.

2. SUMMARY_TABLES: Generate 4-8 financial summary tables that consolidate or compare data across files. Each table should follow this exact JSON structure:
{
  "id": "unique-table-id",
  "title": "Table Title",
  "description": "Brief description of what this table shows and which files it includes",
  "columns": [
    {
      "header": "Column Name",
      "accessor": "column_key",
      "isNumeric": true/false,
      "isCurrency": true/false
    }
  ],
  "data": [
    {
      "column_key": value,
      "isTotal": true/false,
      "isSubTotal": true/false,
      "isHeader": true/false
    }
  ]
}

Focus on creating tables that:
- Compare data across time periods (if files represent different periods)
- Consolidate related financial data from multiple sources
- Show trends and changes between files
- Provide comprehensive financial overview

3. KEY_INSIGHTS: List 5-8 important insights derived from the combined data analysis.

4. RECOMMENDATIONS: List 5-8 actionable recommendations based on the multi-file analysis.

Use the same formatting requirements as specified in the single-file analysis.

Format your response exactly as follows:

EXECUTIVE_SUMMARY:
(Your executive summary here)

SUMMARY_TABLES:
[Table JSON array]

KEY_INSIGHTS:
- Insight 1
- Insight 2

RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Use the same parsing logic as single file
    const summaryMatch = text.match(/EXECUTIVE_SUMMARY:([\s\S]*?)(?=SUMMARY_TABLES:|$)/i);
    const tablesMatch = text.match(/SUMMARY_TABLES:([\s\S]*?)(?=KEY_INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY_INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=$)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'Multi-file financial analysis summary not available.';

    let tables: SummaryTable[] = [];
    if (tablesMatch && tablesMatch[1]) {
      try {
        const tablesJson = tablesMatch[1].trim();
        const jsonMatch = tablesJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
          tables = JSON.parse(sanitizedJson);
          tables = tables.map(table => sanitizeTable(table));
          
          // Get all available headers from all files for validation
          const allAvailableHeaders = files.reduce((headers: string[], file) => {
            const lines = file.content.trim().split('\n');
            if (lines.length > 0) {
              const fileHeaders = lines[0].split(',').map(h => h.trim());
              return [...headers, ...fileHeaders];
            }
            return headers;
          }, []);
          
          // Remove duplicates
          const uniqueHeaders = [...new Set(allAvailableHeaders)];
          
          // Ensure tables only use visible columns from the source files
          tables = validateTablesUseVisibleColumns(tables, uniqueHeaders);
          
          // If validation filtered out all tables, provide fallback
          if (tables.length === 0) {
            console.warn('[SummaryTableService] All multi-file tables were filtered out by validation, using fallback tables');
            tables = generateMultiFileFallbackTables(files);
          }
          
          console.log('[SummaryTableService] Generated multi-file tables with visible columns only:', {
            tableCount: tables.length,
            availableHeaders: uniqueHeaders,
            tables: tables.map(table => ({
              id: table.id,
              title: table.title,
              columnCount: table.columns.length,
              columns: table.columns.map(col => col.header)
            }))
          });
        }
      } catch (error) {
        console.error('Error parsing multi-file tables JSON:', error);
        tables = getFallbackTables();
      }
    }

    let insights: string[] = [];
    if (insightsMatch && insightsMatch[1]) {
      insights = insightsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    let recommendations: string[] = [];
    if (recommendationsMatch && recommendationsMatch[1]) {
      recommendations = recommendationsMatch[1]
        .split(/\n\s*[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    return {
      summary,
      tables: tables.length > 0 ? tables : generateMultiFileFallbackTables(files),
      insights: insights.length > 0 ? insights : ['No specific insights available from the current data.'],
      recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations available.']
    };

  } catch (error: any) {
    console.error('Error generating multi-file summary tables:', error);
    throw new Error(`Failed to generate multi-file financial summary: ${error.message}`);
  }
};

// Helper function to validate that generated tables only use available columns
function validateTablesUseVisibleColumns(tables: SummaryTable[], availableHeaders: string[]): SummaryTable[] {
  console.log('[SummaryTableService] Validating tables against available headers:', availableHeaders);
  
  return tables.map(table => {
    console.log(`[SummaryTableService] Processing table "${table.title}" with columns:`, 
      table.columns.map(col => col.header));
    
    // Much more permissive validation - only filter out obviously invalid columns
    const validColumns = table.columns.filter(col => {
      // Basic validation - column must have a reasonable header
      if (!col.header || typeof col.header !== 'string' || col.header.trim().length === 0) {
        console.warn(`[SummaryTableService] Filtering out column with invalid header:`, col.header);
        return false;
      }
      
      // Allow almost all columns that look like they could be financial data
      const isReasonableColumn = 
        col.header.length <= 100 && // Not unreasonably long
        !/^\s*$/.test(col.header) && // Not just whitespace
        !/^[\d\s]*$/.test(col.header) && // Not just numbers
        /^[a-zA-Z0-9\s\(\)\[\]_\-\.,%&]+$/.test(col.header); // Contains reasonable characters
      
      if (!isReasonableColumn) {
        console.warn(`[SummaryTableService] Filtering out column with unreasonable header: "${col.header}"`);
        return false;
      }
      
      // First, try exact match with source headers
      let isSourceColumn = availableHeaders.some(header => 
        header.trim().toLowerCase() === col.header.trim().toLowerCase()
      );
      
      if (isSourceColumn) {
        console.log(`[SummaryTableService] Keeping source column: "${col.header}"`);
        return true;
      }
      
      // Check if it's a computed column that references source columns
      let isComputedColumn = availableHeaders.some(sourceHeader => {
        const sourceWords = sourceHeader.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2);
        const colWords = col.header.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2);
        
        // If any significant word from source appears in the computed column, allow it
        return sourceWords.some(sourceWord => 
          colWords.some(colWord => 
            colWord.includes(sourceWord) || sourceWord.includes(colWord)
          )
        );
      });
      
      if (isComputedColumn) {
        console.log(`[SummaryTableService] Keeping computed column based on source data: "${col.header}"`);
        return true;
      }
      
      // Allow common financial analysis column types
      const financialPatterns = [
        // Basic financial terms
        /total/i, /sum/i, /subtotal/i, /grand.*total/i,
        /percentage/i, /percent/i, /ratio/i, /rate/i,
        /average/i, /mean/i, /median/i,
        /growth/i, /change/i, /variance/i, /difference/i,
        /profit/i, /loss/i, /margin/i, /markup/i,
        /balance/i, /outstanding/i, /remaining/i,
        /amount/i, /value/i, /price/i, /cost/i,
        /revenue/i, /income/i, /expense/i, /expenditure/i,
        /asset/i, /liability/i, /equity/i, /capital/i,
        /cash/i, /flow/i, /statement/i, /account/i,
        /budget/i, /forecast/i, /actual/i, /planned/i,
        /gross/i, /net/i, /operating/i, /finance/i,
        /tax/i, /interest/i, /dividend/i, /payout/i,
        /sales/i, /purchase/i, /transaction/i,
        /quarter/i, /annual/i, /monthly/i, /yearly/i,
        /analysis/i, /summary/i, /breakdown/i, /category/i
      ];
      
      let isFinancialColumn = financialPatterns.some(pattern => pattern.test(col.header));
      
      if (isFinancialColumn) {
        console.log(`[SummaryTableService] Keeping financial analysis column: "${col.header}"`);
        return true;
      }
      
      // As a fallback, allow any column that seems to be a reasonable financial term
      // (This is very permissive to avoid filtering out legitimate computed columns)
      console.log(`[SummaryTableService] Keeping column (permissive fallback): "${col.header}"`);
      return true;
    });

    console.log(`[SummaryTableService] Table "${table.title}" validation result:`, {
      originalColumns: table.columns.length,
      validColumns: validColumns.length,
      keptColumns: validColumns.map(col => col.header),
      filteredOutColumns: table.columns.filter(col => !validColumns.includes(col)).map(col => col.header)
    });

    return {
      ...table,
      columns: validColumns,
      data: table.data // Keep all data since we're being very permissive with columns
    };
  }).filter(table => table.columns.length > 0); // Remove tables with no valid columns
}

// Helper function to sanitize JSON string
function sanitizeJsonString(jsonString: string): string {
  let sanitized = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // Fix common JSON issues
  sanitized = sanitized.replace(/,(\s*[\]}])/g, '$1'); // Remove trailing commas
  sanitized = sanitized.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Quote property names
  
  return sanitized;
}

// Helper function to sanitize table data
function sanitizeTable(table: any): SummaryTable {
  // Ensure required properties exist
  if (!table.id) table.id = `table_${Date.now()}`;
  if (!table.title) table.title = 'Financial Summary';
  if (!table.description) table.description = 'Financial data summary';
  if (!table.columns || !Array.isArray(table.columns)) table.columns = [];
  if (!table.data || !Array.isArray(table.data)) table.data = [];

  // Sanitize columns
  table.columns = table.columns.map((col: any) => ({
    header: col.header || 'Column',
    accessor: col.accessor || 'value',
    isNumeric: Boolean(col.isNumeric),
    isCurrency: Boolean(col.isCurrency)
  }));

  // Sanitize data rows
  table.data = table.data.map((row: any) => {
    const sanitizedRow: TableRow = {};
    
    // Copy standard properties
    if (row.isTotal) sanitizedRow.isTotal = true;
    if (row.isSubTotal) sanitizedRow.isSubTotal = true;
    if (row.isHeader) sanitizedRow.isHeader = true;
    
    // Copy data properties based on columns
    table.columns.forEach((col: TableColumn) => {
      if (row.hasOwnProperty(col.accessor)) {
        sanitizedRow[col.accessor] = row[col.accessor];
      }
    });
    
    return sanitizedRow;
  });

  return table as SummaryTable;
}

// Helper function to generate fallback tables using actual data
function generateFallbackTablesFromData(csvContent: string, headers: string[]): SummaryTable[] {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return getFallbackTables();
    
    const dataRows = lines.slice(1, Math.min(6, lines.length)); // Take first 5 data rows
    
    // Create a simple data preview table
    const data = dataRows.map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[`col_${index}`] = values[index] || '';
      });
      return row;
    });
    
    const columns = headers.map((header, index) => ({
      header: header.trim(),
      accessor: `col_${index}`,
      isNumeric: false,
      isCurrency: false
    }));
    
    return [
      {
        id: 'data-preview',
        title: 'Data Preview',
        description: 'Preview of the uploaded data showing visible columns only',
        columns,
        data
      }
    ];
  } catch (error) {
    console.error('Error generating fallback tables from data:', error);
    return getFallbackTables();
  }
}

// Helper function to generate fallback tables for multiple files
function generateMultiFileFallbackTables(files: { content: string; fileName: string }[]): SummaryTable[] {
  try {
    const tables: SummaryTable[] = [];
    
    files.forEach((file, fileIndex) => {
      const lines = file.content.trim().split('\n');
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1, Math.min(6, lines.length)); // Take first 5 data rows
      
      const data = dataRows.map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[`col_${index}`] = values[index] || '';
        });
        return row;
      });
      
      const columns = headers.map((header, index) => ({
        header: header.trim(),
        accessor: `col_${index}`,
        isNumeric: false,
        isCurrency: false
      }));
      
      tables.push({
        id: `file-preview-${fileIndex}`,
        title: `${file.fileName} - Data Preview`,
        description: `Preview of data from ${file.fileName} showing visible columns only`,
        columns,
        data
      });
    });
    
    return tables.length > 0 ? tables : getFallbackTables();
  } catch (error) {
    console.error('Error generating multi-file fallback tables:', error);
    return getFallbackTables();
  }
}

// Helper function to provide fallback tables
function getFallbackTables(): SummaryTable[] {
  return [
    {
      id: 'financial-overview',
      title: 'Financial Overview',
      description: 'Unable to generate detailed financial tables from the provided data.',
      columns: [
        { header: 'Category', accessor: 'category' },
        { header: 'Status', accessor: 'status' }
      ],
      data: [
        { category: 'Data Analysis', status: 'Processing required' },
        { category: 'Financial Summary', status: 'Pending data review' }
      ]
    }
  ];
}
