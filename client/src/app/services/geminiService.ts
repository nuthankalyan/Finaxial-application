'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface FinancialInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
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