'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface FinancialInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
  rawResponse: string;
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
`;

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response to extract the different sections
    const summaryMatch = text.match(/SUMMARY:([\s\S]*?)(?=KEY INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=$)/i);

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

    return {
      summary,
      insights: insights.length > 0 ? insights : ['No insights available'],
      recommendations: recommendations.length > 0 ? recommendations : ['No recommendations available'],
      rawResponse: text
    };
  } catch (error: any) {
    console.error('Error analyzing CSV with Gemini:', error);
    throw new Error(`Failed to analyze data: ${error.message}`);
  }
}; 

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

IMPORTANT: For any bar charts you generate, include options to display data values above each bar.Don't include data values for other charts other than bar charts

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
          },
          "formatter": "function(value) { return value.toLocaleString(); }"
        }
      }
    }
  }
]

Ensure the colors are visually appealing and that the chart types you choose are the most appropriate for effectively visualizing the patterns in the data. Use professional color schemes and always use double quotes for property names and string values.
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
      
      // Fix JSON by replacing single quotes with double quotes
      // Also handle other common invalid JSON issues
      let jsonString = jsonMatch[0];
      
      // 1. Replace single quotes with double quotes (but not inside already quoted strings)
      jsonString = jsonString.replace(/(\w+)\'(\w+)/g, '$1"$2'); // Replace words with apostrophes
      
      // 2. More comprehensive single quote replacement
      let fixedJson = '';
      let inDoubleQuote = false;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        const nextChar = jsonString[i + 1] || '';
        
        // Toggle inDoubleQuote flag when we hit a double quote
        if (char === '"') {
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
      
      // 3. Fix property names without quotes
      fixedJson = fixedJson.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      
      // 4. Fix trailing commas in arrays and objects
      fixedJson = fixedJson.replace(/,(\s*[\]}])/g, '$1');
      
      console.log("Original JSON:", jsonString);
      console.log("Fixed JSON:", fixedJson);
      
      try {
        const chartData: ChartData[] = JSON.parse(fixedJson);
        return chartData;
      } catch (innerParseError) {
        console.error('Error parsing fixed JSON:', innerParseError);
        
        // As a fallback, try a more aggressive approach
        // Replace all single quotes with double quotes and then normalize
        const aggressiveReplace = jsonString.replace(/'/g, '"');
        
        // Try to fix invalid property names and trailing commas
        const normalizedJson = aggressiveReplace
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Fix unquoted property names
          .replace(/,(\s*[\]}])/g, '$1'); // Fix trailing commas
          
        console.log("Fallback JSON:", normalizedJson);
        
        const chartData: ChartData[] = JSON.parse(normalizedJson);
        return chartData;
      }
    } catch (parseError: unknown) {
      console.error('Error parsing chart data JSON:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      throw new Error(`Failed to parse chart data from Gemini response: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error generating chart data with Gemini:', error);
    throw new Error(`Failed to generate chart data: ${error.message}`);
  }
}; 