import type { TableSchema, TableField } from '../types/schema';
import { inferColumnType } from './typeInference';

interface FileData {
  content: string;
  file: File;
  type: 'csv' | 'excel';
}

interface ParsedFileData {
  headers: string[];
  rows: string[][];
  sheets?: { name: string; headers: string[]; rows: string[][] }[];
}

function inferRelationship(
  fieldName: string,
  tableName: string,
  allTableNames: string[]
): { table: string; field: string } | undefined {
  const normalizedFieldName = fieldName.toLowerCase();
  
  // Remove common suffixes to get the base table name
  const baseTableName = normalizedFieldName
    .replace(/_id$/, '')
    .replace(/_key$/, '')
    .replace(/_fk$/, '')
    .replace(/_ref$/, '')
    .replace(/_reference$/, '');

  // Try to find a matching table
  const matchingTable = allTableNames.find(table => {
    const normalizedTableName = table.toLowerCase()
      .replace(/s$/, '') // Handle simple plurals
      .replace(/_data$/, '') // Handle _data suffix
      .replace(/_table$/, '') // Handle _table suffix
      .replace(/^tbl_/, ''); // Handle tbl_ prefix
    
    return (
      normalizedTableName === baseTableName ||
      normalizedTableName.includes(baseTableName) ||
      baseTableName.includes(normalizedTableName)
    );
  });

  if (matchingTable) {
    return {
      table: matchingTable,
      field: 'id' // Assuming 'id' is the default primary key
    };
  }

  return undefined;
}

export function prepareTableSchemas(
  parsedFiles: ParsedFileData[],
  files: FileData[]
): TableSchema[] {
  const tableNames = files.map(file => file.file.name.replace(/\.[^/.]+$/, ""));
  
  return parsedFiles.map((file, index) => {
    const tableName = tableNames[index];
    const fields = file.headers.map(header => {
      const headerLower = header.trim().toLowerCase();
      const values = file.rows.map(row => row[file.headers.indexOf(header)]);
      
      const fieldData: TableField = {
        name: header.trim(),
        type: inferColumnType(values),
        isPrimary: headerLower === 'id' || 
                  headerLower === `${tableName.toLowerCase()}_id`,
        isForeign: false,
        references: undefined
      };

      // Detect if this field might be a foreign key
      if (
        headerLower.endsWith('_id') ||
        headerLower.endsWith('_key') ||
        headerLower.endsWith('_fk') ||
        headerLower.includes('reference') ||
        (headerLower.includes('id') && headerLower !== 'id')
      ) {
        fieldData.isForeign = true;
        fieldData.references = inferRelationship(header, tableName, tableNames);
      }

      // Enhance type detection for potential foreign keys
      if (fieldData.isForeign && fieldData.type === 'integer') {
        fieldData.type = 'reference';
      }

      return fieldData;
    });

    return {
      name: tableName,
      fields: fields
    };
  });
}

// Removed duplicate inferColumnType function as it's now imported from typeInference.ts
