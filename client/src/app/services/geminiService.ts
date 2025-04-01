'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface FinancialInsights {
  summary: string;
  insights: string;
  recommendations: string;
  rawResponse: string;
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

2. KEY INSIGHTS: Identify the most important patterns, trends, or anomalies in the data. Look for interesting correlations, significant changes over time, or notable outliers.

3. RECOMMENDATIONS: Based on this data, what actions would you recommend? Consider investment advice, cost-cutting measures, growth opportunities, or risk management strategies as appropriate.

Format your response as follows:
SUMMARY:
(your summary here)

KEY INSIGHTS:
(your key insights here)

RECOMMENDATIONS:
(your recommendations here)
`;

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response to extract the different sections
    const summaryMatch = text.match(/SUMMARY:([\s\S]*?)(?=KEY INSIGHTS:|$)/i);
    const insightsMatch = text.match(/KEY INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:([\s\S]*?)(?=$)/i);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : 'No summary available',
      insights: insightsMatch ? insightsMatch[1].trim() : 'No insights available',
      recommendations: recommendationsMatch ? recommendationsMatch[1].trim() : 'No recommendations available',
      rawResponse: text
    };
  } catch (error: any) {
    console.error('Error analyzing CSV with Gemini:', error);
    throw new Error(`Failed to analyze data: ${error.message}`);
  }
}; 