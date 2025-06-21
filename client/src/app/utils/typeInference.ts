// Helper function to infer column type from values
export function inferColumnType(values: string[]): string {
  // Skip empty values for type inference
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonEmptyValues.length === 0) return 'string';

  // Check if all values are numbers
  if (nonEmptyValues.every(v => !isNaN(Number(v)))) {
    // Check if all numbers are integers
    if (nonEmptyValues.every(v => Number.isInteger(Number(v)))) {
      return 'integer';
    }
    return 'decimal';
  }

  // Check if all values are valid dates
  if (nonEmptyValues.every(v => !isNaN(Date.parse(v)))) {
    return 'datetime';
  }

  // Check if all values are boolean
  const booleanValues = ['true', 'false', '0', '1', 'yes', 'no'];
  if (nonEmptyValues.every(v => booleanValues.includes(v.toLowerCase()))) {
    return 'boolean';
  }

  // Default to string
  return 'string';
}
