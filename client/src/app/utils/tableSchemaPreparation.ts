import type { TableSchema, TableField } from '../types/schema';
import { inferColumnType } from './typeInference';
import { HiddenColumnsMap } from '../types/hiddenColumns';

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
  files: FileData[],
  hiddenColumns?: HiddenColumnsMap
): TableSchema[] {
  let schemas: TableSchema[] = [];
  
  // Try to get hiddenColumns from localStorage if not provided
  const hiddenColumnsData = hiddenColumns || (() => {
    try {
      const storedHiddenColumns = localStorage.getItem('hiddenColumns');
      return storedHiddenColumns ? JSON.parse(storedHiddenColumns) : {};
    } catch (e) {
      console.error('Error parsing hidden columns from localStorage:', e);
      return {};
    }
  })();
  
  parsedFiles.forEach((file, fileIndex) => {
    if (file.sheets && file.sheets.length > 0) {
      // Handle Excel workbook with multiple sheets
      file.sheets.forEach((sheet, sheetIndex) => {
        // Skip empty sheets
        if (!sheet.headers || sheet.headers.length === 0) {
          console.log(`Skipping empty sheet: ${sheet.name}`);
          return;
        }

        // Clean and normalize sheet name
        const sheetName = sheet.name.replace(/[^a-zA-Z0-9]/g, '_').trim();
        if (!sheetName) {
          console.log(`Skipping sheet with invalid name: ${sheet.name}`);
          return;
        }

        // Get all table names for relationship detection
        const allTableNames = parsedFiles.flatMap(f => 
          f.sheets 
            ? f.sheets
                .filter(s => s.headers && s.headers.length > 0)
                .map(s => `${files[parsedFiles.indexOf(f)].file.name.replace(/\.[^/.]+$/, "")}_${s.name.replace(/[^a-zA-Z0-9]/g, '_')}`)
            : [files[parsedFiles.indexOf(f)].file.name.replace(/\.[^/.]+$/, "")]
        );
        
        // Get hidden columns for this file/sheet
        const fileHiddenColumns = hiddenColumnsData[fileIndex]?.[sheetIndex] || [];

        // Filter out hidden columns
        const visibleHeaderIndices = sheet.headers
          .map((_, index) => index)
          .filter(index => !fileHiddenColumns.includes(index));
        
        const fields = visibleHeaderIndices.map(headerIndex => {
          const header = sheet.headers[headerIndex];
          const headerLower = header.trim().toLowerCase();
          const values = sheet.rows.map(row => 
            row[headerIndex] || ''
          );
          
          const fieldData: TableField = {
            name: header.trim(),
            type: inferColumnType(values),
            isPrimary: headerLower === 'id' || 
                      headerLower === `${sheetName.toLowerCase()}_id`,
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
            fieldData.references = inferRelationship(header, sheetName, allTableNames);
          }

          // Enhance type detection for potential foreign keys
          if (fieldData.isForeign && fieldData.type === 'integer') {
            fieldData.type = 'reference';
          }

          return fieldData;
        });

        const tableName = `${files[fileIndex].file.name.replace(/\.[^/.]+$/, "")}_${sheetName}`;
        console.log(`Processing sheet: ${sheet.name} -> ${tableName} with ${fields.length} fields`);
        
        schemas.push({
          name: tableName,
          fields: fields
        });
      });

      // Log summary of processed sheets
      console.log(`Processed ${file.sheets.length} sheets from ${files[fileIndex].file.name}`);
    } else {
      // Handle single CSV or single-sheet Excel file
      const tableName = files[fileIndex].file.name.replace(/\.[^/.]+$/, "");
      
      // Skip if no headers
      if (!file.headers || file.headers.length === 0) {
        console.log(`Skipping file with no headers: ${tableName}`);
        return;
      }
      
      // Get hidden columns for this file
      const fileHiddenColumns = hiddenColumnsData[fileIndex]?.[0] || [];
      
      // Filter out hidden columns
      const visibleHeaderIndices = file.headers
        .map((_, index) => index)
        .filter(index => !fileHiddenColumns.includes(index));

      const fields = visibleHeaderIndices.map(headerIndex => {
        const header = file.headers[headerIndex];
        const headerLower = header.trim().toLowerCase();
        const values = file.rows.map(row => row[headerIndex] || '');
        
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
          const allTableNames = parsedFiles.map(f => 
            files[parsedFiles.indexOf(f)].file.name.replace(/\.[^/.]+$/, "")
          );
          fieldData.references = inferRelationship(header, tableName, allTableNames);
        }

        // Enhance type detection for potential foreign keys
        if (fieldData.isForeign && fieldData.type === 'integer') {
          fieldData.type = 'reference';
        }

        return fieldData;
      });

      console.log(`Processing single file: ${tableName} with ${fields.length} fields`);
      
      schemas.push({
        name: tableName,
        fields: fields
      });
    }
  });

  console.log(`Total schemas generated: ${schemas.length}`);
  return schemas;
}

// Removed duplicate inferColumnType function as it's now imported from typeInference.ts
