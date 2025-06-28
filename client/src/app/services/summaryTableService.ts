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
 * Generates financial summary tables from CSV data using Gemini AI
 */
export const generateSummaryTables = async (csvContent: string, fileName?: string): Promise<ReportData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_2;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are a financial analyst. Analyze the following CSV data and generate comprehensive financial summary tables suitable for a professional financial report.

CSV DATA:
${csvContent}

${fileName ? `FILE NAME: ${fileName}` : ''}

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
      tables: tables.length > 0 ? tables : getFallbackTables(),
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
 */
export const generateMultiFileSummaryTables = async (files: { content: string; fileName: string }[]): Promise<ReportData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare file contents
    const filesContent = files.map((file, index) => 
      `FILE ${index + 1}: ${file.fileName}\n${file.content}\n\n`
    ).join('');

    const prompt = `
You are a financial analyst. Analyze the following multiple CSV files and generate comprehensive financial summary tables that consolidate and compare data across all files.

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
      insights: insights.length > 0 ? insights : ['No specific insights available from the current data.'],
      recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations available.']
    };

  } catch (error: any) {
    console.error('Error generating multi-file summary tables:', error);
    throw new Error(`Failed to generate multi-file financial summary: ${error.message}`);
  }
};

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
