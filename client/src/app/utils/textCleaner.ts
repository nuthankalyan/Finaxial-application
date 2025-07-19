/**
 * Utility functions to clean text content by removing formatting characters
 * Used to clean AI-generated content that may contain asterisks and other markdown formatting
 */

/**
 * Removes asterisks and other formatting characters from text
 * This function specifically targets content patterns like:
 * - **80C Investment Underutilization:**
 * - **Expense Management Variability:**  
 * - **Revenue Growth in Specific Departments:**
 * - **Tax Efficiency Discrepancies:**
 */
export const cleanText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove all asterisks - both single and double
    .replace(/\*+/g, '')
    // Remove markdown headers
    .replace(/#+\s*/g, '')
    // Remove bold markdown (in case any remain)
    .replace(/\*\*/g, '')
    // Remove italic markdown
    .replace(/\*/g, '')
    // Remove leading bullet points and dashes
    .replace(/^\s*[-•]\s*/, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();
};

/**
 * Clean text while preserving basic structure
 * This version is more conservative and preserves some formatting
 */
export const cleanTextPreserveStructure = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove asterisks used for bold formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove single asterisks used for italic formatting  
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove any remaining standalone asterisks
    .replace(/\*/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Clean an array of text items
 */
export const cleanTextArray = (textArray: string[]): string[] => {
  if (!Array.isArray(textArray)) {
    return [];
  }

  return textArray
    .map(text => cleanText(text))
    .filter(text => text.length > 0);
};

/**
 * Clean insights object containing summary, insights, and recommendations
 */
export const cleanInsightsObject = (insights: any): any => {
  if (!insights || typeof insights !== 'object') {
    return insights;
  }

  const cleaned = { ...insights };

  // Clean summary
  if (typeof cleaned.summary === 'string') {
    cleaned.summary = cleanText(cleaned.summary);
  }

  // Clean insights array
  if (Array.isArray(cleaned.insights)) {
    cleaned.insights = cleanTextArray(cleaned.insights);
  } else if (typeof cleaned.insights === 'string') {
    cleaned.insights = cleanText(cleaned.insights);
  }

  // Clean recommendations array
  if (Array.isArray(cleaned.recommendations)) {
    cleaned.recommendations = cleanTextArray(cleaned.recommendations);
  } else if (typeof cleaned.recommendations === 'string') {
    cleaned.recommendations = cleanText(cleaned.recommendations);
  }

  // Clean any other text fields that might exist
  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'string' && key !== 'rawResponse') {
      cleaned[key] = cleanText(cleaned[key]);
    } else if (Array.isArray(cleaned[key]) && 
               cleaned[key].every((item: any) => typeof item === 'string')) {
      cleaned[key] = cleanTextArray(cleaned[key]);
    }
  });

  return cleaned;
};

/**
 * Clean summary table data
 */
export const cleanSummaryTable = (table: any): any => {
  if (!table || typeof table !== 'object') {
    return table;
  }

  const cleaned = { ...table };

  // Clean title and description
  if (cleaned.title) {
    cleaned.title = cleanText(cleaned.title);
  }
  if (cleaned.description) {
    cleaned.description = cleanText(cleaned.description);
  }

  // Clean column headers
  if (Array.isArray(cleaned.columns)) {
    cleaned.columns = cleaned.columns.map((col: any) => ({
      ...col,
      header: col.header ? cleanText(col.header) : col.header
    }));
  }

  // Clean data values that are strings
  if (Array.isArray(cleaned.data)) {
    cleaned.data = cleaned.data.map((row: any) => {
      const cleanedRow = { ...row };
      Object.keys(cleanedRow).forEach(key => {
        if (typeof cleanedRow[key] === 'string' && 
            !['isTotal', 'isSubTotal', 'isHeader'].includes(key)) {
          cleanedRow[key] = cleanText(cleanedRow[key]);
        }
      });
      return cleanedRow;
    });
  }

  return cleaned;
};

export default {
  cleanText,
  cleanTextPreserveStructure,
  cleanTextArray,
  cleanInsightsObject,
  cleanSummaryTable
};
