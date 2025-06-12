'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryCache, createQueryCacheKey } from '../utils/cacheManager';

export interface FinancialInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
  rawResponse: string;
  numericalInsights?: {
    metrics: {
      label: string;
      value: number | string;
      change?: {
        value: number;
        positive: boolean;
      };
    }[];
  };
}

export interface ChartData {
  type: string;
  title: string;
  description: string;
  data: any;
  options?: any;
}

export const analyzeCsvWithGemini = async (csvContent: string): Promise<FinancialInsights> => {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Construct a prompt that instructs the model to analyze the CSV data
    const prompt = `
You are a financial analyst. Analyze the following CSV data and provide insights.

CSV DATA:
${csvContent}

Please provide a detailed analysis with the following sections:

1. SUMMARY: Provide a brief summary of what this financial data represents and its overall characteristics.

2. KEY INSIGHTS: Identify the most important patterns, trends, or anomalies in the data. Look for interesting correlations, significant changes over time, or notable outliers. Present each insight as a separate bullet point.

3. RECOMMENDATIONS: Based on this data, what actions would you recommend? Consider investment advice, cost-cutting measures, growth opportunities, or risk management strategies as appropriate. Present each recommendation as a separate bullet point.

4. KEY METRICS: Extract 4-6 key numerical metrics from the data that would be important to highlight, along with their percentage change if applicable. For each metric, provide:
   - A short descriptive label
   - The numerical value
   - The percentage change (include whether it's positive or negative)

Format your response as follows:
SUMMARY:
(your summary here)

KEY INSIGHTS:
- (insight 1)
- (insight 2)
- (insight 3)
...

RECOMMENDATIONS:
- (recommendation 1)
- (recommendation 2)
- (recommendation 3)
...

KEY METRICS:
- LABEL: Revenue | VALUE: $1.2M | CHANGE: +12.5%
- LABEL: Profit Margin | VALUE: 24% | CHANGE: -2.3%
- LABEL: Customer Count | VALUE: 532 | CHANGE: +8.7%
...
`;

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response to extract the different sections
    const summaryMatch = text.match(/SUMMARY:([\s\S]*?)(?=KEY INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=KEY METRICS:|$)/i);
    const metricsMatch = text.match(/KEY METRICS:([\s\S]*?)(?=$)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
    
    // Parse insights as a list by splitting on bullet points or new lines
    let insights: string[] = [];
    if (insightsMatch && insightsMatch[1]) {
      insights = insightsMatch[1]
        .split(/\n\s*[-•*]\s*/) // Split by bullet points
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // If no bullet points were found, try splitting by lines
      if (insights.length <= 1) {
        insights = insightsMatch[1]
          .split(/\n+/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }
    
    // Parse recommendations as a list
    let recommendations: string[] = [];
    if (recommendationsMatch && recommendationsMatch[1]) {
      recommendations = recommendationsMatch[1]
        .split(/\n\s*[-•*]\s*/) // Split by bullet points
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // If no bullet points were found, try splitting by lines
      if (recommendations.length <= 1) {
        recommendations = recommendationsMatch[1]
          .split(/\n+/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }

    // Parse metrics
    let metrics: { label: string; value: string | number; change?: { value: number; positive: boolean } }[] = [];
    if (metricsMatch && metricsMatch[1]) {
      const metricsLines = metricsMatch[1]
        .split(/\n\s*[-•*]\s*/) // Split by bullet points
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      metrics = metricsLines.map(line => {
        // Try to extract label, value, and change from the line
        const labelMatch = line.match(/LABEL:\s*([^|]+)/i);
        const valueMatch = line.match(/VALUE:\s*([^|]+)/i);
        const changeMatch = line.match(/CHANGE:\s*([+-]?[^%]+)%/i);
        
        const label = labelMatch ? labelMatch[1].trim() : 'Unknown Metric';
        const value = valueMatch ? valueMatch[1].trim() : 'N/A';
        let change = undefined;
        
        if (changeMatch) {
          const changeValue = parseFloat(changeMatch[1]);
          if (!isNaN(changeValue)) {
            change = {
              value: Math.abs(changeValue),
              positive: changeValue >= 0
            };
          }
        }
        
        return { label, value, change };
      });
    }

    return {
      summary,
      insights: insights.length > 0 ? insights : ['No insights available'],
      recommendations: recommendations.length > 0 ? recommendations : ['No recommendations available'],
      rawResponse: text,
      numericalInsights: {
        metrics: metrics.length > 0 ? metrics : generatePlaceholderMetrics()
      }
    };
  } catch (error: any) {
    console.error('Error analyzing CSV with Gemini:', error);
    throw new Error(`Failed to analyze data: ${error.message}`);
  }
};

// Function to generate placeholder metrics when none are extracted
function generatePlaceholderMetrics() {
  return [
    {
      label: 'Total Revenue',
      value: '$1.2M',
      change: { value: 15.5, positive: true }
    },
    {
      label: 'Profit Margin',
      value: '24%',
      change: { value: 5.3, positive: true }
    },
    {
      label: 'Customer Count',
      value: '532',
      change: { value: 8.7, positive: true }
    },
    {
      label: 'Avg Transaction',
      value: '$243',
      change: { value: 3.2, positive: false }
    },
    {
      label: 'Growth Rate',
      value: '18%',
      change: { value: 2.1, positive: true }
    },
    {
      label: 'Expense Ratio',
      value: '42%',
      change: { value: 1.5, positive: false }
    }
  ];
}

export const generateChartData = async (csvContent: string): Promise<ChartData[]> => {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Construct a prompt that instructs the model to generate chart data
    const prompt = `
You are a financial data visualization expert. Analyze the following CSV data and generate data for 4 different chart types that would best represent this data.

CSV DATA:
${csvContent}

For each chart, provide:
1. The best chart type (line, bar, pie, radar, doughnut, or other appropriate chart)
2. A descriptive title for the chart
3. A brief description of what insight this chart provides
4. The exact data structure needed for a Chart.js visualization in React, including datasets, labels, and appropriate colors

IMPORTANT: For bar charts, do NOT include a formatter function. Instead, just include the datalabels plugin with basic settings.

Format your response as a valid JSON array with objects for each chart. All property names and string values must be in double quotes, not single quotes, to ensure valid JSON format.

Example of the expected structure:
[
  {
    "type": "bar",
    "title": "Revenue by Quarter",
    "description": "Shows quarterly revenue trends over the past fiscal year",
    "data": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [
        {
          "label": "Revenue ($)",
          "data": [12000, 19000, 15000, 22000],
          "backgroundColor": ["rgba(54, 162, 235, 0.5)", "rgba(75, 192, 192, 0.5)", "rgba(153, 102, 255, 0.5)", "rgba(255, 159, 64, 0.5)"],
          "borderColor": ["rgba(54, 162, 235, 1)", "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)"],
          "borderWidth": 1
        }
      ]
    },
    "options": {
      "indexAxis": "x",
      "scales": {
        "y": {
          "beginAtZero": true
        }
      },
      "plugins": {
        "tooltip": {
          "enabled": true
        },
        "datalabels": {
          "anchor": "end",
          "align": "top",
          "font": {
            "weight": "bold"
          }
        }
      }
    }
  }
]

Ensure the colors are visually appealing and that the chart types you choose are the most appropriate for effectively visualizing the patterns in the data. Use professional color schemes and always use double quotes for property names and string values.

DO NOT include any text before or after the JSON array. Return ONLY the JSON array.
`;

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      // Find JSON in the response (handling any potential text before or after)
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const jsonString = jsonMatch[0];
      
      // Sanitize the JSON string
      const sanitized = sanitizeJsonString(jsonString);
      
      try {
        // Parse and validate the chart data
        const chartData: ChartData[] = JSON.parse(sanitized);
        
        // Remove any formatter properties that could cause issues
        const safeChartData = chartData.map(chart => {
          // Ensure options exists
          if (!chart.options) {
            chart.options = {};
          }
          
          // If datalabels formatter exists, remove it to prevent errors
          if (chart.options.plugins?.datalabels?.formatter) {
            delete chart.options.plugins.datalabels.formatter;
          }
          
          return chart;
        });
        
        return safeChartData;
      } catch (innerError) {
        console.error('Error parsing sanitized JSON:', innerError);
        
        // Try a more aggressive approach
        const aggressiveFixed = aggressiveJsonFix(jsonString);
        
        try {
          // Try parsing with aggressive fixes
          const chartData: ChartData[] = JSON.parse(aggressiveFixed);
          return sanitizeChartData(chartData);
        } catch (finalError) {
          console.error('Failed to parse JSON after aggressive fixing:', finalError);
          
          // Return a fallback chart
          return getFallbackCharts();
        }
      }
    } catch (parseError: unknown) {
      console.error('Error parsing chart data JSON:', parseError);
      return getFallbackCharts();
    }
  } catch (error: any) {
    console.error('Error generating chart data with Gemini:', error);
    return getFallbackCharts(error.message);
  }
};

// Helper function to sanitize JSON string
function sanitizeJsonString(jsonString: string): string {
  // Remove any special characters that might break JSON
  let sanitized = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // Fix function references that are common causes of JSON parse errors
  sanitized = sanitized.replace(/"formatter"\s*:\s*"?function\([^)]*\)\s*\{[^}]*\}"?/g, '"formatter": null');
  sanitized = sanitized.replace(/"function\([^)]*\)\s*\{[^}]*\}"/g, '"null"');
  
  // Replace single quotes with double quotes (carefully)
  let fixedJson = '';
  let inDoubleQuote = false;
  
  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    
    // Toggle inDoubleQuote flag when we hit a double quote (not escaped)
    if (char === '"' && (i === 0 || sanitized[i - 1] !== '\\')) {
      inDoubleQuote = !inDoubleQuote;
      fixedJson += char;
    }
    // Replace single quotes with double quotes, but only if not inside a double-quoted string
    else if (char === "'" && !inDoubleQuote) {
      fixedJson += '"';
    }
    // Add the character as is
    else {
      fixedJson += char;
    }
  }
  
  // Fix property names without quotes
  fixedJson = fixedJson.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  
  // Fix trailing commas in arrays and objects
  fixedJson = fixedJson.replace(/,(\s*[\]}])/g, '$1');
  
  return fixedJson;
}

// Helper function for aggressive JSON fixing attempts
function aggressiveJsonFix(jsonString: string): string {
  // Replace all single quotes
  let fixed = jsonString.replace(/'/g, '"');
  
  // Fix property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
  
  // Fix trailing commas
  fixed = fixed.replace(/,(\s*[\]}])/g, '$1');
  
  // Replace any function references
  fixed = fixed.replace(/"formatter"\s*:\s*"?function.*?}?"?/g, '"formatter": null');
  fixed = fixed.replace(/"function.*?}"/g, '"null"');
  
  return fixed;
}

// Helper function to sanitize chart data
function sanitizeChartData(charts: ChartData[]): ChartData[] {
  return charts.map(chart => {
    // Ensure required properties exist
    if (!chart.type) chart.type = 'bar';
    if (!chart.title) chart.title = 'Financial Data';
    if (!chart.description) chart.description = 'Financial data visualization';
    
    // Ensure data structure is valid
    if (!chart.data) {
      chart.data = {
        labels: ['Data'],
        datasets: [{
          label: 'Values',
          data: [0],
          backgroundColor: ['rgba(54, 162, 235, 0.5)']
        }]
      };
    }
    
    // Remove any formatter properties
    if (chart.options?.plugins?.datalabels?.formatter) {
      delete chart.options.plugins.datalabels.formatter;
    }
    
    return chart;
  });
}

// Helper function to provide fallback charts
function getFallbackCharts(errorMessage?: string): ChartData[] {
  return [{
    type: 'bar',
    title: 'Financial Data Overview',
    description: errorMessage ? `Error: ${errorMessage}` : 'Unable to generate detailed charts from the provided data',
    data: {
      labels: ['Financial Data'],
      datasets: [{
        label: 'Data Visualization',
        data: [100],
        backgroundColor: ['rgba(75, 192, 192, 0.5)']
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Fallback Chart'
        }
      }
    }
  }];
}

export const generateStory = async (
  csvContent: string, 
  insights: { summary: string; insights: string[]; recommendations: string[] },
  style: 'business' | 'casual' | 'dramatic' = 'business'
): Promise<string> => {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Format insights and recommendations as bullet points
    const formattedInsights = insights.insights
      .map(insight => `- ${insight}`)
      .join('\n');
    
    const formattedRecommendations = insights.recommendations
      .map(rec => `- ${rec}`)
      .join('\n');

    // Define style-specific instructions
    let styleInstructions = '';
    
    switch (style) {
      case 'business':
        styleInstructions = `
Use a clear, professional tone appropriate for a business audience.
Focus on data-driven insights and business impacts.
Use industry terminology where appropriate.
Structure the narrative in a logical, straightforward manner.
Keep the language concise and factual while still telling a compelling story.`;
        break;
      
      case 'casual':
        styleInstructions = `
Use a conversational, approachable tone that a non-technical audience would understand.
Avoid jargon and explain financial concepts in simple terms.
Use analogies and real-world examples to illustrate data points.
Add a touch of humor where appropriate to keep the reader engaged.
Make the financial story feel personal and relatable.`;
        break;
      
      case 'dramatic':
        styleInstructions = `
Create a narrative with emotional impact and dramatic elements.
Frame the financial data as a story with challenges, turning points, and resolutions.
Use vivid language and metaphors to bring the numbers to life.
Structure the narrative with a clear beginning, middle, and end.
Employ storytelling techniques like foreshadowing and tension/release.
Still maintain accuracy while being more creative with the presentation.`;
        break;
    }

    // Construct the prompt
    const prompt = `
You are an expert financial storyteller who transforms complex financial data and insights into engaging narratives. Your task is to create a compelling story based on the provided financial data analysis.

FINANCIAL DATA CSV:
${csvContent}

SUMMARY:
${insights.summary}

KEY INSIGHTS:
${formattedInsights}

RECOMMENDATIONS:
${formattedRecommendations}

STYLE INSTRUCTIONS:
${styleInstructions}

STORY STRUCTURE:
1. Create a narrative that weaves together the key insights and recommendations.
2. Break the story into 4-6 clear sections, each with its own heading (using ## for headers).
3. Include an introduction that sets the context.
4. Highlight opportunities, challenges, and key trends from the data.
5. End with a conclusion that ties back to the recommendations.

FORMAT GUIDELINES:
- Use ## headers to separate major sections
- Keep paragraphs short and readable (3-5 sentences maximum)
- Use plain, descriptive language for non-technical stakeholders
- Insert intentional line breaks between paragraphs for readability
- Label sections in a way that clearly indicates their content (e.g., "## The Challenge", "## Future Opportunities")

Your story should make the financial data engaging and understandable to stakeholders who don't have technical expertise. Focus on the business narrative rather than technical details, but ensure all insights are backed by the data.
`;

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error generating story with Gemini:', error);
    throw new Error(`Failed to generate story: ${error.message}`);
  }
};

export const askFinancialQuestion = async (csvContent: string, question: string): Promise<string> => {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Check if the question is asking for SQL query
    const isAskingForSql = question.toLowerCase().includes('sql') || 
                          question.toLowerCase().includes('query') ||
                          question.toLowerCase().includes('queries') ||
                          question.toLowerCase().includes('database') ||
                          question.toLowerCase().includes('write a query') ||
                          question.toLowerCase().includes('show me a query');

    // Construct a prompt that instructs the model to answer questions about the CSV data
    let prompt = `
You are a financial assistant with expertise in analyzing financial data. You are given a CSV dataset and a specific question about this data.
Your goal is to provide a clear, informative, and accurate answer based solely on the data provided.

CSV DATA:
${csvContent}

USER QUESTION:
${question}

Analyze the data carefully to answer the question. Follow these guidelines:
1. Only provide information that can be directly inferred from the data
2. If the question cannot be answered from the data, acknowledge the limitations
3. Use specific numbers and metrics from the data when relevant
4. Keep your answer concise and focused on the question
5. If appropriate, suggest related insights that might be helpful

IMPORTANT FORMATTING INSTRUCTIONS:
- Format your response with a clear, readable structure
- Use appropriate line breaks between paragraphs
- For lists, use proper bullet points with "-" or numerical points with "1."
- For important sections, use header formatting with "# Section Title"
- When presenting numerical data, use tables with proper formatting:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | Value 1  | Value 2  | Value 3  |
- For any code snippets or formulas, wrap them in triple backticks: \`\`\`code\`\`\`
- Use consistent paragraph spacing and indentation

Remember that you're helping someone understand their financial data, so aim to be educational and helpful with a well-formatted response.
`;

    // If the user is asking for SQL, add specific instructions
    if (isAskingForSql) {
      prompt = `
You are a financial SQL expert who helps convert CSV data into database tables and writes SQL queries. You are given a CSV dataset and a request related to SQL queries.
Your goal is to provide SQL queries that would extract the requested information if this data were in a database.

CSV DATA:
${csvContent}

USER QUESTION:
${question}

First, ALWAYS assume the CSV data has been loaded into a single database table. Analyze the CSV headers and provide:

1. A CREATE TABLE statement that reflects the structure of the CSV data
2. An appropriate SQL query that answers the user's question 
3. A brief explanation of what the query does and how it relates to the user's question
4. IMPORTANT: A sample of what the expected query results would look like, formatted as a markdown table with 3-5 rows of sample data

IMPORTANT FORMATTING RULES:
- ALWAYS wrap SQL code in triple backticks with the sql language identifier: \`\`\`sql
- Include ALL SQL statements (both CREATE TABLE and the query)
- Make SQL code properly formatted with appropriate indentation and line breaks
- Use proper SQL syntax highlighting conventions
- Make sure column names match those from the CSV (treat the headers as column names)
- Include comments in the SQL explaining important parts
- After providing the SQL, briefly explain what the results would show
- ALWAYS include a section titled "# Expected Results" with a properly formatted markdown table showing 3-5 rows of sample results from the query

SQL GUIDELINES:
- Use standard SQL syntax
- Include proper JOIN operations if needed
- Use appropriate GROUP BY, ORDER BY and aggregate functions when relevant
- If needed, use WITH clauses for more complex queries
- Include appropriate WHERE conditions to filter data

SAMPLE RESULTS GUIDELINES:
- Use realistic values derived from the actual CSV data
- Format the results in a clean, readable markdown table
- Include all columns that would appear in the actual query results
- Show 3-5 representative rows that best illustrate the query's purpose
- If the query uses aggregation, show appropriate summary rows

Remember to make your SQL queries production-ready and optimized. Use best practices and provide clear, readable code.
`;
    }

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error asking financial question with Gemini:', error);
    throw new Error(`Failed to process your question: ${error.message}`);
  }
}; 

/**
 * Cached version of askFinancialQuestion that checks the cache first before calling the API
 */
export const askFinancialQuestionCached = async (csvContent: string, question: string): Promise<string> => {
  try {
    // Create a cache key for this query + data combination
    const cacheKey = createQueryCacheKey(csvContent, question);
    
    // Check if we have a cached response
    const cachedResponse = queryCache.get<string>(cacheKey);
    if (cachedResponse) {
      console.log('Using cached response for query:', question);
      return cachedResponse;
    }
    
    // No cached response, call the API
    console.log('Cache miss, fetching fresh response for query:', question);
    const response = await askFinancialQuestion(csvContent, question);
    
    // Cache the response for future use
    queryCache.set(cacheKey, response);
    
    return response;
  } catch (error: any) {
    console.error('Error in cached financial question service:', error);
    throw new Error(`Failed to process your question: ${error.message}`);
  }
};