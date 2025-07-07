export interface DataTransformation {
  id: string;
  name: string;
  description: string;
  category: 'cleanup' | 'format' | 'calculate' | 'filter';
  applicable: boolean;
}

export interface TransformationRule {
  id: string;
  type: 'replace' | 'remove_duplicates' | 'fill_missing' | 'convert_type' | 'calculate_column' | 'filter_rows';
  column?: string;
  parameters: Record<string, any>;
  description: string;
}

export interface TransformationResult {
  success: boolean;
  transformedData: {
    headers: string[];
    rows: string[][];
  };
  appliedRules: TransformationRule[];
  summary: string;
  warnings?: string[];
}

class DataTransformationService {
  
  // Get available transformations based on data analysis
  getAvailableTransformations(headers: string[], rows: string[][]): DataTransformation[] {
    const transformations: DataTransformation[] = [
      // Cleanup transformations
      {
        id: 'remove_duplicates',
        name: 'Remove Duplicate Rows',
        description: 'Remove rows that are completely identical',
        category: 'cleanup',
        applicable: this.hasDuplicateRows(rows)
      },
      {
        id: 'trim_whitespace',
        name: 'Trim Whitespace',
        description: 'Remove leading and trailing spaces from all text values',
        category: 'cleanup',
        applicable: this.hasExtraWhitespace(rows)
      },
      {
        id: 'remove_empty_rows',
        name: 'Remove Empty Rows',
        description: 'Remove rows where all cells are empty',
        category: 'cleanup',
        applicable: this.hasEmptyRows(rows)
      },
      {
        id: 'fill_missing_values',
        name: 'Fill Missing Values',
        description: 'Replace empty cells with appropriate default values',
        category: 'cleanup',
        applicable: this.hasMissingValues(rows)
      },
      
      // Format transformations
      {
        id: 'standardize_dates',
        name: 'Standardize Date Formats',
        description: 'Convert all date columns to a consistent format (YYYY-MM-DD)',
        category: 'format',
        applicable: this.hasDateColumns(headers, rows)
      },
      {
        id: 'standardize_numbers',
        name: 'Standardize Number Formats',
        description: 'Remove currency symbols and normalize number formats',
        category: 'format',
        applicable: this.hasNumberColumns(headers, rows)
      },
      {
        id: 'normalize_text_case',
        name: 'Normalize Text Case',
        description: 'Standardize text to proper case or uppercase',
        category: 'format',
        applicable: this.hasTextColumns(headers, rows)
      },
      
      // Calculate transformations
      {
        id: 'add_calculated_columns',
        name: 'Add Calculated Columns',
        description: 'Create new columns based on calculations from existing data',
        category: 'calculate',
        applicable: this.hasNumericColumns(headers, rows)
      },
      {
        id: 'create_summary_statistics',
        name: 'Add Summary Statistics',
        description: 'Add columns with running totals, averages, or percentages',
        category: 'calculate',
        applicable: this.hasNumericColumns(headers, rows)
      },
      
      // Filter transformations
      {
        id: 'filter_by_value',
        name: 'Filter Rows by Value',
        description: 'Remove rows based on specific criteria',
        category: 'filter',
        applicable: true
      },
      {
        id: 'sort_data',
        name: 'Sort Data',
        description: 'Sort rows by one or more columns',
        category: 'filter',
        applicable: rows.length > 1
      }
    ];

    return transformations.filter(t => t.applicable);
  }

  // Apply a set of transformation rules to the data
  async applyTransformations(
    headers: string[],
    rows: string[][],
    rules: TransformationRule[]
  ): Promise<TransformationResult> {
    try {
      let transformedHeaders = [...headers];
      let transformedRows = rows.map(row => [...row]);
      const appliedRules: TransformationRule[] = [];
      const warnings: string[] = [];

      for (const rule of rules) {
        try {
          const result = this.applyRule(transformedHeaders, transformedRows, rule);
          transformedHeaders = result.headers;
          transformedRows = result.rows;
          appliedRules.push(rule);
          
          if (result.warning) {
            warnings.push(result.warning);
          }
        } catch (error) {
          warnings.push(`Failed to apply transformation "${rule.description}": ${error}`);
        }
      }

      return {
        success: true,
        transformedData: {
          headers: transformedHeaders,
          rows: transformedRows
        },
        appliedRules,
        summary: `Applied ${appliedRules.length} transformation${appliedRules.length !== 1 ? 's' : ''} successfully.`,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        transformedData: { headers, rows },
        appliedRules: [],
        summary: `Transformation failed: ${error.message}`,
        warnings: [error.message]
      };
    }
  }

  private applyRule(
    headers: string[],
    rows: string[][],
    rule: TransformationRule
  ): { headers: string[]; rows: string[][]; warning?: string } {
    switch (rule.type) {
      case 'remove_duplicates':
        return this.removeDuplicates(headers, rows);
      
      case 'fill_missing':
        return this.fillMissingValues(headers, rows, rule);
      
      case 'replace':
        return this.replaceValues(headers, rows, rule);
      
      case 'convert_type':
        return this.convertDataType(headers, rows, rule);
      
      case 'calculate_column':
        return this.addCalculatedColumn(headers, rows, rule);
      
      case 'filter_rows':
        return this.filterRows(headers, rows, rule);
      
      default:
        throw new Error(`Unknown transformation type: ${rule.type}`);
    }
  }

  private removeDuplicates(headers: string[], rows: string[][]): { headers: string[]; rows: string[][] } {
    const uniqueRows: string[][] = [];
    const seenRows = new Set<string>();

    for (const row of rows) {
      const rowString = row.join('|');
      if (!seenRows.has(rowString)) {
        seenRows.add(rowString);
        uniqueRows.push(row);
      }
    }

    return { headers, rows: uniqueRows };
  }

  private fillMissingValues(
    headers: string[],
    rows: string[][],
    rule: TransformationRule
  ): { headers: string[]; rows: string[][] } {
    const fillValue = rule.parameters.fillValue || '';
    const columnIndex = rule.column ? headers.indexOf(rule.column) : -1;

    const filledRows = rows.map(row => {
      const newRow = [...row];
      
      if (columnIndex >= 0) {
        // Fill specific column
        if (!newRow[columnIndex] || newRow[columnIndex].trim() === '') {
          newRow[columnIndex] = fillValue;
        }
      } else {
        // Fill all empty cells
        for (let i = 0; i < newRow.length; i++) {
          if (!newRow[i] || newRow[i].trim() === '') {
            newRow[i] = fillValue;
          }
        }
      }
      
      return newRow;
    });

    return { headers, rows: filledRows };
  }

  private replaceValues(
    headers: string[],
    rows: string[][],
    rule: TransformationRule
  ): { headers: string[]; rows: string[][] } {
    const { findValue, replaceValue, isRegex } = rule.parameters;
    const columnIndex = rule.column ? headers.indexOf(rule.column) : -1;

    const replacedRows = rows.map(row => {
      const newRow = [...row];
      
      if (columnIndex >= 0) {
        // Replace in specific column
        if (isRegex && findValue instanceof RegExp) {
          // Handle regex replacement for specific column
          if (newRow[columnIndex]) {
            newRow[columnIndex] = newRow[columnIndex].replace(findValue, replaceValue);
          }
        } else if (newRow[columnIndex] === findValue) {
          // Handle exact match replacement
          newRow[columnIndex] = replaceValue;
        }
      } else {
        // Replace in all columns
        for (let i = 0; i < newRow.length; i++) {
          if (!newRow[i]) continue; // Skip empty cells
          
          if (isRegex && findValue instanceof RegExp) {
            // Handle regex replacement for all columns
            newRow[i] = newRow[i].replace(findValue, replaceValue);
          } else if (newRow[i] === findValue) {
            // Handle exact match replacement
            newRow[i] = replaceValue;
          }
        }
      }
      
      return newRow;
    });

    return { headers, rows: replacedRows };
  }

  private convertDataType(
    headers: string[],
    rows: string[][],
    rule: TransformationRule
  ): { headers: string[]; rows: string[][]; warning?: string } {
    const columnIndex = rule.column ? headers.indexOf(rule.column) : -1;
    const targetType = rule.parameters.targetType;
    
    if (columnIndex < 0) {
      throw new Error(`Column "${rule.column}" not found`);
    }

    const convertedRows = rows.map(row => {
      const newRow = [...row];
      const value = newRow[columnIndex];
      
      try {          switch (targetType) {
            case 'number':
              if (value) {
                // Handle various number formats including currency symbols, commas, and percentages
                const cleanValue = value.replace(/[$,€£¥]/g, '').replace(/[^0-9.-]/g, '');
                const parsedValue = parseFloat(cleanValue);
                
                if (!isNaN(parsedValue)) {
                  // Format numbers with two decimal places for financial data
                  newRow[columnIndex] = parsedValue.toFixed(2);
                } else {
                  // Keep original if parsing fails
                  newRow[columnIndex] = value;
                }
              } else {
                newRow[columnIndex] = '0.00';
              }
              break;
            case 'date':
              if (value) {
                try {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    // ISO format YYYY-MM-DD
                    newRow[columnIndex] = date.toISOString().split('T')[0];
                  } else {
                    // Try to parse common formats
                    const parts = value.split(/[\/\-\.]/);
                    if (parts.length === 3) {
                      // Assume MM/DD/YYYY or DD/MM/YYYY
                      const month = parseInt(parts[0]) <= 12 ? parts[0] : parts[1];
                      const day = parseInt(parts[0]) <= 12 ? parts[1] : parts[0];
                      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      newRow[columnIndex] = formattedDate;
                    } else {
                      // Keep original if parsing fails
                      newRow[columnIndex] = value;
                    }
                  }
                } catch (e) {
                  newRow[columnIndex] = value;
                }
              }
              break;
            case 'text':
              newRow[columnIndex] = value ? value.toString() : '';
              break;
        }
      } catch (error) {
        // Keep original value if conversion fails
      }
      
      return newRow;
    });

    return { headers, rows: convertedRows };
  }

  private addCalculatedColumn(
    headers: string[],
    rows: string[][],
    rule: TransformationRule
  ): { headers: string[]; rows: string[][] } {
    const { columnName, expression, sourceColumns } = rule.parameters;
    const newHeaders = [...headers, columnName];

    const calculatedRows = rows.map(row => {
      let calculatedValue = '';
      
      try {
        // Simple calculations based on expression type
        if (expression === 'sum' && sourceColumns?.length >= 2) {
          const sum = sourceColumns.reduce((total: number, colName: string) => {
            const colIndex = headers.indexOf(colName);
            const value = parseFloat(row[colIndex] || '0');
            return total + (isNaN(value) ? 0 : value);
          }, 0);
          calculatedValue = sum.toString();
        } else if (expression === 'difference' && sourceColumns?.length === 2) {
          const col1Index = headers.indexOf(sourceColumns[0]);
          const col2Index = headers.indexOf(sourceColumns[1]);
          const val1 = parseFloat(row[col1Index] || '0');
          const val2 = parseFloat(row[col2Index] || '0');
          calculatedValue = ((isNaN(val1) ? 0 : val1) - (isNaN(val2) ? 0 : val2)).toString();
        } else if (expression === 'percentage' && sourceColumns?.length === 2) {
          const col1Index = headers.indexOf(sourceColumns[0]);
          const col2Index = headers.indexOf(sourceColumns[1]);
          const val1 = parseFloat(row[col1Index] || '0');
          const val2 = parseFloat(row[col2Index] || '1');
          if (val2 !== 0) {
            calculatedValue = ((val1 / val2) * 100).toFixed(2) + '%';
          }
        }
      } catch (error) {
        calculatedValue = 'Error';
      }
      
      return [...row, calculatedValue];
    });

    return { headers: newHeaders, rows: calculatedRows };
  }

  private filterRows(
    headers: string[],
    rows: string[][],
    rule: TransformationRule
  ): { headers: string[]; rows: string[][] } {
    const { column, operator, value } = rule.parameters;
    const columnIndex = headers.indexOf(column);
    
    if (columnIndex < 0) {
      throw new Error(`Column "${column}" not found`);
    }

    const filteredRows = rows.filter(row => {
      const cellValue = row[columnIndex] || '';
      
      switch (operator) {
        case 'equals':
          return cellValue === value;
        case 'not_equals':
          return cellValue !== value;
        case 'contains':
          return cellValue.toLowerCase().includes(value.toLowerCase());
        case 'not_contains':
          return !cellValue.toLowerCase().includes(value.toLowerCase());
        case 'greater_than':
          return parseFloat(cellValue) > parseFloat(value);
        case 'less_than':
          return parseFloat(cellValue) < parseFloat(value);
        case 'not_empty':
          return cellValue.trim() !== '';
        case 'empty':
          return cellValue.trim() === '';
        default:
          return true;
      }
    });

    return { headers, rows: filteredRows };
  }

  // Helper methods for determining applicability
  private hasDuplicateRows(rows: string[][]): boolean {
    const seen = new Set<string>();
    return rows.some(row => {
      const rowString = row.join('|');
      if (seen.has(rowString)) return true;
      seen.add(rowString);
      return false;
    });
  }

  private hasExtraWhitespace(rows: string[][]): boolean {
    return rows.some(row => 
      row.some(cell => cell && (cell.startsWith(' ') || cell.endsWith(' ')))
    );
  }

  private hasEmptyRows(rows: string[][]): boolean {
    return rows.some(row => row.every(cell => !cell || cell.trim() === ''));
  }

  private hasMissingValues(rows: string[][]): boolean {
    return rows.some(row => row.some(cell => !cell || cell.trim() === ''));
  }

  private hasDateColumns(headers: string[], rows: string[][]): boolean {
    return headers.some(header => 
      /date|time|created|updated|born|modified/i.test(header)
    ) || rows.some(row => 
      row.some(cell => cell && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cell))
    );
  }

  private hasNumberColumns(headers: string[], rows: string[][]): boolean {
    return headers.some(header => 
      /amount|price|cost|value|total|sum|count|quantity|rate|percent/i.test(header)
    ) || rows.some(row => 
      row.some(cell => cell && /^\$?\d+\.?\d*%?$/.test(cell.trim()))
    );
  }

  private hasTextColumns(headers: string[], rows: string[][]): boolean {
    return rows.some(row => 
      row.some(cell => cell && isNaN(parseFloat(cell)) && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cell))
    );
  }

  private hasNumericColumns(headers: string[], rows: string[][]): boolean {
    return headers.some(header => 
      /amount|price|cost|value|total|sum|count|quantity|rate|revenue|profit|expense/i.test(header)
    );
  }
}

export const dataTransformationService = new DataTransformationService();
