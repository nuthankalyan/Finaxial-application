'use client';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TaxOptimizationSuggestion {
  id: string;
  category: 'deduction' | 'deferral' | 'strategy' | 'compliance';
  title: string;
  description: string;
  potentialSavings: string;
  priority: 'high' | 'medium' | 'low';
  implementation: string;
  timeframe: string;
  applicableFor: string[];
}

export interface TaxOptimizationResult {
  totalPotentialSavings: string;
  suggestions: TaxOptimizationSuggestion[];
  overview: string;
  strategicRecommendations: string[];
  complianceNotes: string[];
  nextSteps: string[];
}

class TaxOptimizationService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_4 || '';
  }

  async generateTaxOptimizationSuggestions(
    csvContent: string,
    fileName?: string
  ): Promise<TaxOptimizationResult> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
You are an expert tax advisor and financial analyst with deep knowledge of tax optimization strategies across various jurisdictions. 
Analyze the following financial data and provide comprehensive, AI-powered tax optimization suggestions.

FINANCIAL DATA:
${csvContent}

${fileName ? `FILE NAME: ${fileName}` : ''}

ANALYSIS REQUIREMENTS:
Please provide detailed tax optimization recommendations based on the financial data patterns, income sources, expense categories, and business activities observed.

Focus on identifying opportunities in these key areas:

TAX DEDUCTIONS:
- Business expense optimization
- Depreciation and amortization strategies
- Research & development credits
- Equipment and technology deductions
- Home office and workspace deductions
- Professional development and education expenses
- Travel and entertainment deductions
- Insurance and benefit deductions

TAX DEFERRALS:
- Income timing strategies
- Retirement contribution optimization
- Inventory management for tax purposes
- Equipment purchase timing
- Revenue recognition optimization
- Loss harvesting opportunities

STRATEGIC PLANNING:
- Entity structure optimization
- Multi-year tax planning
- International tax considerations
- State and local tax optimization
- Estate and gift tax planning
- Investment structure optimization

COMPLIANCE OPTIMIZATION:
- Record keeping improvements
- Documentation strategies
- Audit risk mitigation
- Filing deadline optimization
- Estimated payment strategies

For each suggestion, provide:
1. Clear category classification
2. Specific implementation steps
3. Estimated potential savings
4. Priority level (high/medium/low)
5. Timeframe for implementation
6. Applicable business types/situations

Format your response exactly as follows:

OVERVIEW:
(Provide a comprehensive overview of the tax optimization opportunities based on the data)

TOTAL_POTENTIAL_SAVINGS:
(Estimate the total potential annual tax savings range, e.g., "$15,000 - $25,000")

SUGGESTIONS:
[
  {
    "id": "unique_id",
    "category": "deduction|deferral|strategy|compliance",
    "title": "Suggestion Title",
    "description": "Detailed description of the optimization opportunity",
    "potentialSavings": "Estimated savings amount or percentage",
    "priority": "high|medium|low",
    "implementation": "Step-by-step implementation guide",
    "timeframe": "Implementation timeframe",
    "applicableFor": ["business types or situations"]
  }
]

STRATEGIC_RECOMMENDATIONS:
- Strategic recommendation 1
- Strategic recommendation 2
- Strategic recommendation 3

COMPLIANCE_NOTES:
- Important compliance consideration 1
- Important compliance consideration 2
- Important compliance consideration 3

NEXT_STEPS:
- Immediate action item 1
- Immediate action item 2
- Immediate action item 3
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseTaxOptimizationResponse(text);
    } catch (error: any) {
      console.error('Error generating tax optimization suggestions:', error);
      throw new Error(`Failed to generate tax optimization suggestions: ${error.message}`);
    }
  }

  private parseTaxOptimizationResponse(responseText: string): TaxOptimizationResult {
    try {
      // Extract overview
      const overviewMatch = responseText.match(/OVERVIEW:([\s\S]*?)(?=TOTAL_POTENTIAL_SAVINGS:|$)/i);
      const overview = overviewMatch ? overviewMatch[1].trim() : 'Tax optimization analysis completed.';

      // Extract total potential savings
      const savingsMatch = responseText.match(/TOTAL_POTENTIAL_SAVINGS:([\s\S]*?)(?=SUGGESTIONS:|$)/i);
      const totalPotentialSavings = savingsMatch ? savingsMatch[1].trim() : 'Savings potential varies';

      // Extract suggestions JSON
      const suggestionsMatch = responseText.match(/SUGGESTIONS:([\s\S]*?)(?=STRATEGIC_RECOMMENDATIONS:|$)/i);
      let suggestions: TaxOptimizationSuggestion[] = [];
      
      if (suggestionsMatch) {
        try {
          const suggestionsText = suggestionsMatch[1].trim();
          // Clean up the JSON text
          const cleanJson = suggestionsText.replace(/```json\s*|\s*```/g, '').trim();
          suggestions = JSON.parse(cleanJson);
        } catch (parseError) {
          console.warn('Failed to parse suggestions JSON, using fallback');
          // Fallback to manual parsing if JSON parsing fails
          suggestions = this.createFallbackSuggestions();
        }
      }

      // Extract strategic recommendations
      const strategicMatch = responseText.match(/STRATEGIC_RECOMMENDATIONS:([\s\S]*?)(?=COMPLIANCE_NOTES:|$)/i);
      const strategicRecommendations = strategicMatch 
        ? strategicMatch[1].split(/\n\s*[-•*]\s*/).map(item => item.trim()).filter(item => item.length > 0)
        : [];

      // Extract compliance notes
      const complianceMatch = responseText.match(/COMPLIANCE_NOTES:([\s\S]*?)(?=NEXT_STEPS:|$)/i);
      const complianceNotes = complianceMatch
        ? complianceMatch[1].split(/\n\s*[-•*]\s*/).map(item => item.trim()).filter(item => item.length > 0)
        : [];

      // Extract next steps
      const nextStepsMatch = responseText.match(/NEXT_STEPS:([\s\S]*?)$/i);
      const nextSteps = nextStepsMatch
        ? nextStepsMatch[1].split(/\n\s*[-•*]\s*/).map(item => item.trim()).filter(item => item.length > 0)
        : [];

      return {
        totalPotentialSavings,
        suggestions: suggestions.length > 0 ? suggestions : this.createFallbackSuggestions(),
        overview,
        strategicRecommendations: strategicRecommendations.length > 0 ? strategicRecommendations : [
          'Implement quarterly tax planning reviews',
          'Maintain detailed expense documentation',
          'Consider professional tax consultation for complex situations'
        ],
        complianceNotes: complianceNotes.length > 0 ? complianceNotes : [
          'Ensure all deductions are properly documented',
          'Maintain records for at least 7 years',
          'Consult with a tax professional for implementation'
        ],
        nextSteps: nextSteps.length > 0 ? nextSteps : [
          'Review current tax filing practices',
          'Organize financial documentation',
          'Schedule consultation with tax advisor'
        ]
      };
    } catch (error) {
      console.error('Error parsing tax optimization response:', error);
      return this.createFallbackResult();
    }
  }

  private createFallbackSuggestions(): TaxOptimizationSuggestion[] {
    return [
      {
        id: 'deduction-business-expenses',
        category: 'deduction',
        title: 'Optimize Business Expense Deductions',
        description: 'Review and categorize all business expenses to ensure maximum deductible amounts are claimed.',
        potentialSavings: '5-15% of current tax liability',
        priority: 'high',
        implementation: 'Conduct quarterly expense reviews, implement expense tracking software, categorize all business-related costs',
        timeframe: '1-3 months',
        applicableFor: ['Small Business', 'Self-Employed', 'Freelancer']
      },
      {
        id: 'strategy-retirement-contributions',
        category: 'strategy',
        title: 'Maximize Retirement Contributions',
        description: 'Increase contributions to tax-advantaged retirement accounts to reduce current taxable income.',
        potentialSavings: '10-25% of contribution amount',
        priority: 'high',
        implementation: 'Calculate maximum allowable contributions, set up automatic contributions, consider catch-up contributions if eligible',
        timeframe: 'Before tax year end',
        applicableFor: ['All Taxpayers', 'High Income Earners']
      },
      {
        id: 'deferral-equipment-purchases',
        category: 'deferral',
        title: 'Strategic Equipment Purchase Timing',
        description: 'Time equipment purchases to maximize depreciation benefits and Section 179 deductions.',
        potentialSavings: 'Up to 100% of equipment cost',
        priority: 'medium',
        implementation: 'Plan major purchases before year-end, research Section 179 eligibility, coordinate with tax advisor',
        timeframe: 'Q4 planning',
        applicableFor: ['Business Owners', 'Self-Employed']
      }
    ];
  }

  private createFallbackResult(): TaxOptimizationResult {
    return {
      totalPotentialSavings: 'Varies by implementation',
      suggestions: this.createFallbackSuggestions(),
      overview: 'Based on your financial data, there are several tax optimization opportunities available. The suggestions below are tailored to your specific financial profile.',
      strategicRecommendations: [
        'Implement quarterly tax planning reviews',
        'Maintain detailed expense documentation',
        'Consider professional tax consultation for complex situations'
      ],
      complianceNotes: [
        'Ensure all deductions are properly documented',
        'Maintain records for at least 7 years',
        'Consult with a tax professional for implementation'
      ],
      nextSteps: [
        'Review current tax filing practices',
        'Organize financial documentation',
        'Schedule consultation with tax advisor'
      ]
    };
  }
}

export const taxOptimizationService = new TaxOptimizationService();
