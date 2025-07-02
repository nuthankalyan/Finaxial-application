import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AnomalyDetectionResult {
  hasAnomalies: boolean;
  anomalies: Anomaly[];
  summary: string;
}

export interface Anomaly {
  type: 'outlier' | 'missing_data' | 'inconsistent_format' | 'invalid_value' | 'duplicate';
  column: string;
  row?: number;
  value?: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface AnomalyCellHighlight {
  row: number;
  column: string;
  anomalyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

class AnomalyDetectionService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  async detectAnomalies(
    csvContent: string,
    fileName?: string
  ): Promise<AnomalyDetectionResult> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
You are a data quality analyst. Analyze the following CSV data for anomalies and data quality issues.

Look for the following types of anomalies:
1. OUTLIERS: Values that are significantly different from the expected range
2. MISSING_DATA: Empty cells, null values, or placeholder text like "N/A", "NULL", "-"
3. INCONSISTENT_FORMAT: Date formats, number formats, text casing inconsistencies
4. INVALID_VALUE: Values that don't match the expected data type for the column
5. DUPLICATE: Duplicate rows or suspicious duplicate values

CSV DATA:
${csvContent}

${fileName ? `FILE NAME: ${fileName}` : ''}

Please provide your analysis in the following JSON format:
{
  "hasAnomalies": true/false,
  "summary": "Brief summary of data quality assessment",
  "anomalies": [
    {
      "type": "outlier|missing_data|inconsistent_format|invalid_value|duplicate",
      "column": "column_name",
      "row": row_number_if_applicable,
      "value": "the_problematic_value",
      "description": "Clear description of the issue",
      "severity": "low|medium|high",
      "suggestion": "How to fix this issue"
    }
  ]
}

Guidelines:
- Only report significant anomalies that could affect analysis
- Provide specific row numbers when possible (1-indexed, excluding header)
- For outliers, consider the context of the data (financial data may have legitimate large variations)
- Severity levels: high = data corruption/major errors, medium = formatting issues, low = minor inconsistencies
- Limit to the 20 most significant anomalies to avoid overwhelming the user
- If no significant anomalies found, set hasAnomalies to false and provide empty anomalies array

Return only valid JSON, no additional text.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI model');
      }

      const anomalyResult = JSON.parse(jsonMatch[0]) as AnomalyDetectionResult;

      // Validate and sanitize the result
      return this.sanitizeAnomalyResult(anomalyResult);

    } catch (error: any) {
      console.error('Error detecting anomalies:', error);
      // Return a fallback result
      return {
        hasAnomalies: false,
        anomalies: [],
        summary: 'Unable to perform anomaly detection at this time. Please proceed with manual review.'
      };
    }
  }

  private sanitizeAnomalyResult(result: any): AnomalyDetectionResult {
    return {
      hasAnomalies: Boolean(result.hasAnomalies),
      summary: result.summary || 'Anomaly detection completed.',
      anomalies: Array.isArray(result.anomalies) ? result.anomalies.map((anomaly: any) => ({
        type: anomaly.type || 'invalid_value',
        column: anomaly.column || 'unknown',
        row: typeof anomaly.row === 'number' ? anomaly.row : undefined,
        value: anomaly.value || '',
        description: anomaly.description || 'Data quality issue detected',
        severity: ['low', 'medium', 'high'].includes(anomaly.severity) ? anomaly.severity : 'medium',
        suggestion: anomaly.suggestion || 'Review and correct the data'
      })) : []
    };
  }

  // Get anomaly highlights for table cells
  getAnomalyCellHighlights(anomalies: Anomaly[]): AnomalyCellHighlight[] {
    return anomalies
      .filter(anomaly => anomaly.row !== undefined && anomaly.column)
      .map(anomaly => ({
        row: anomaly.row! - 1, // Convert to 0-indexed for array access
        column: anomaly.column,
        anomalyType: anomaly.type,
        description: anomaly.description,
        severity: anomaly.severity
      }));
  }

  // Quick statistical analysis for basic outlier detection
  async detectBasicOutliers(data: string[][], headers: string[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    headers.forEach((header, colIndex) => {
      const values = data
        .map((row, rowIndex) => ({ value: row[colIndex], rowIndex }))
        .filter(item => item.value && item.value.trim() !== '')
        .map(item => ({ ...item, numValue: parseFloat(item.value) }))
        .filter(item => !isNaN(item.numValue));

      if (values.length < 3) return; // Need at least 3 values for outlier detection

      const numValues = values.map(v => v.numValue);
      const mean = numValues.reduce((sum, val) => sum + val, 0) / numValues.length;
      const stdDev = Math.sqrt(
        numValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numValues.length
      );

      // Detect outliers using 3-sigma rule
      values.forEach(({ value, rowIndex, numValue }) => {
        const zScore = Math.abs((numValue - mean) / stdDev);
        if (zScore > 3) {
          anomalies.push({
            type: 'outlier',
            column: header,
            row: rowIndex + 1,
            value: value,
            description: `Statistical outlier: value ${numValue.toFixed(2)} is ${zScore.toFixed(1)} standard deviations from the mean (${mean.toFixed(2)})`,
            severity: zScore > 4 ? 'high' : 'medium',
            suggestion: 'Verify if this value is correct or should be excluded from analysis'
          });
        }
      });
    });

    return anomalies;
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
