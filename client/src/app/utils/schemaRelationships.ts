import type { TableSchema, TableField } from '../types/schema';
import { RelationType, type Relationship } from '../types/relationships';

// Helper function to get the singular form of a word
function getSingular(word: string): string {
  const commonPluralEndings = [
    { plural: 'ies', singular: 'y' },
    { plural: 'ses', singular: 's' },
    { plural: 's', singular: '' }
  ];

  const wordLower = word.toLowerCase();
  for (const { plural, singular } of commonPluralEndings) {
    if (wordLower.endsWith(plural)) {
      return word.slice(0, -plural.length) + singular;
    }
  }
  return word;
}

// Helper function to normalize table/field names for comparison
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(id|key|ref|reference|fk)$/g, '');
}

export function detectRelationships(tables: TableSchema[]): Relationship[] {
  const relationships: Relationship[] = [];
  const primaryKeys = new Map<string, string>();
  const uniqueConstraints = new Map<string, Set<string>>();
  const compositeKeys = new Map<string, string[]>();

  // First pass: collect keys and constraints
  tables.forEach(table => {
    // Find primary keys
    const explicitPrimaryKey = table.fields.find(field => field.isPrimary);
    const implicitPrimaryKey = table.fields.find(field => 
      field.name.toLowerCase() === 'id' ||
      field.name.toLowerCase() === `${getSingular(table.name.toLowerCase())}_id`
    );
    
    if (explicitPrimaryKey || implicitPrimaryKey) {
      primaryKeys.set(table.name, (explicitPrimaryKey || implicitPrimaryKey)!.name);
    }

    // Find unique constraints and composite keys
    const tableUniqueFields = new Set<string>();
    const potentialCompositeKey: string[] = [];
    
    table.fields.forEach(field => {
      const fieldNameLower = field.name.toLowerCase();
      if (
        fieldNameLower.includes('unique') ||
        field.type.toLowerCase().includes('unique') ||
        fieldNameLower.startsWith('key_')
      ) {
        tableUniqueFields.add(field.name);
      }

      // Look for potential composite key fields
      if (
        fieldNameLower.endsWith('_id') ||
        fieldNameLower.endsWith('_key') ||
        fieldNameLower.includes('reference')
      ) {
        potentialCompositeKey.push(field.name);
      }
    });

    uniqueConstraints.set(table.name, tableUniqueFields);
    if (potentialCompositeKey.length >= 2) {
      compositeKeys.set(table.name, potentialCompositeKey);
    }
  });

  // Detect many-to-many junction tables
  const junctionTables = new Set<string>();
  tables.forEach(table => {
    // Junction table typically has:
    // 1. Exactly two foreign key fields
    // 2. A composite primary key of these fields
    // 3. Few or no other fields besides timestamps
    const foreignKeyFields = table.fields.filter(f => 
      f.isForeign || f.name.toLowerCase().endsWith('_id')
    );
    
    if (foreignKeyFields.length === 2 && table.fields.length <= 5) {
      junctionTables.add(table.name);
    }
  });

  // Second pass: detect relationships
  tables.forEach(sourceTable => {
    const sourceTableNormalized = normalizeName(sourceTable.name);
    
    sourceTable.fields.forEach(field => {
      const fieldNameLower = field.name.toLowerCase();
      const normalizedFieldName = normalizeName(field.name);

      // Skip already processed composite key fields
      if (compositeKeys.has(sourceTable.name) && 
          compositeKeys.get(sourceTable.name)!.includes(field.name)) {
        return;
      }

      // Handle explicit references first
      if (field.isForeign && field.references) {
        const relationType = determineRelationType(sourceTable, field, tables.find(t => t.name === field.references!.table)!, uniqueConstraints);
        relationships.push({
          fromTable: sourceTable.name,
          fromField: field.name,
          toTable: field.references.table,
          toField: field.references.field,
          type: relationType
        });
        return;
      }

      // Look for potential relationships based on field patterns
      if (fieldNameLower.endsWith('_id') || 
          fieldNameLower.endsWith('_key') || 
          fieldNameLower.includes('reference') ||
          field.type.toLowerCase().includes('reference')) {
        
        // Try to find the referenced table
        const possibleTableName = normalizedFieldName;
        const targetTables = tables.filter(t => {
          const normalizedTableName = normalizeName(t.name);
          return (
            normalizedTableName === possibleTableName ||
            normalizedTableName === getSingular(possibleTableName) ||
            possibleTableName.includes(normalizedTableName) ||
            possibleTableName.includes(getSingular(normalizedTableName))
          );
        });

        targetTables.forEach(targetTable => {
          const targetPrimaryKey = primaryKeys.get(targetTable.name);
          if (targetPrimaryKey) {
            const relationType = determineRelationType(sourceTable, field, targetTable, uniqueConstraints);
            relationships.push({
              fromTable: sourceTable.name,
              fromField: field.name,
              toTable: targetTable.name,
              toField: targetPrimaryKey,
              type: relationType
            });
          }
        });
      }
    });
  });

  // Third pass: detect many-to-many relationships through junction tables
  tables.forEach(table => {
    // Check if this table might be a junction table
    if (compositeKeys.has(table.name)) {
      const keyFields = compositeKeys.get(table.name)!;
      if (keyFields.length === 2) {
        const [field1, field2] = keyFields;
        const normalizedField1 = normalizeName(field1);
        const normalizedField2 = normalizeName(field2);

        // Find the tables these fields might reference
        const findReferencedTables = (fieldName: string) => {
          return tables.filter(t => {
            const normalizedTableName = normalizeName(t.name);
            return (
              normalizedTableName === fieldName ||
              normalizedTableName === getSingular(fieldName) ||
              fieldName.includes(normalizedTableName) ||
              fieldName.includes(getSingular(normalizedTableName))
            );
          });
        };

        const table1Candidates = findReferencedTables(normalizedField1);
        const table2Candidates = findReferencedTables(normalizedField2);

        table1Candidates.forEach(table1 => {
          table2Candidates.forEach(table2 => {
            if (table1.name !== table2.name) {
              relationships.push({
                fromTable: table1.name,
                fromField: primaryKeys.get(table1.name)!,
                toTable: table2.name,
                toField: primaryKeys.get(table2.name)!,
                type: RelationType.MANY_TO_MANY,
                through: {
                  tableName: table.name,
                  fromField: field1,
                  toField: field2
                }
              });
            }
          });
        });
      }
    }  });

  // Add direct column name matching (a more aggressive approach)
  tables.forEach(sourceTable => {
    sourceTable.fields.forEach(sourceField => {
      // Check if this field looks like a foreign key
      if (sourceField.name.toLowerCase().includes('id') || 
          sourceField.name.toLowerCase().includes('key') ||
          sourceField.name.toLowerCase().includes('ref')) {
        
        tables.forEach(targetTable => {
          // Don't compare with self
          if (targetTable.name === sourceTable.name) return;
          
          targetTable.fields.forEach(targetField => {
            // Look for exact name matches or name_id pattern
            if (sourceField.name === targetField.name || 
                sourceField.name === `${targetTable.name.toLowerCase()}_${targetField.name}` ||
                sourceField.name === `${getSingular(targetTable.name.toLowerCase())}_${targetField.name}`) {
              
              // Add this as a potential relationship
              relationships.push({
                fromTable: sourceTable.name,
                fromField: sourceField.name,
                toTable: targetTable.name,
                toField: targetField.name,
                type: determineRelationType(sourceTable, sourceField, targetTable, uniqueConstraints)
              });
            }
          });
        });
      }
    });
  });

  // Clean up duplicate or redundant relationships
  return deduplicateRelationships(relationships);
}

// Helper function to deduplicate relationships
function deduplicateRelationships(relationships: Relationship[]): Relationship[] {
  // Use a more specific key that includes field names to avoid dropping valid relationships
  const seen = new Set<string>();
  return relationships.filter(relation => {
    const key1 = `${relation.fromTable}.${relation.fromField}-${relation.toTable}.${relation.toField}`;
    const key2 = `${relation.toTable}.${relation.toField}-${relation.fromTable}.${relation.fromField}`;
    
    if (seen.has(key1) || seen.has(key2)) {
      return false;
    }
    
    seen.add(key1);
    seen.add(key2);
    return true;
  });
}

function determineRelationType(
  sourceTable: TableSchema,
  sourceField: TableField,
  targetTable: TableSchema,
  uniqueConstraints: Map<string, Set<string>>
): RelationType {
  const fieldNameLower = sourceField.name.toLowerCase();
  const tableNameLower = sourceTable.name.toLowerCase();
  const targetTableLower = targetTable.name.toLowerCase();

  // Check for explicit one-to-one indicators
  if (
    fieldNameLower.includes('one_to_one') ||
    fieldNameLower.includes('1to1') ||
    uniqueConstraints.get(sourceTable.name)?.has(sourceField.name)
  ) {
    return RelationType.ONE_TO_ONE;
  }

  // Check for explicit many-to-many indicators
  if (
    fieldNameLower.includes('many_to_many') ||
    fieldNameLower.includes('mtm') ||
    targetTableLower.includes('many') ||
    tableNameLower.includes('many')
  ) {
    return RelationType.MANY_TO_MANY;
  }

  // Check for collection/array indicators suggesting one-to-many
  if (
    fieldNameLower.includes('collection') ||
    fieldNameLower.includes('array') ||
    fieldNameLower.includes('list') ||
    fieldNameLower.includes('items') ||
    targetTableLower.endsWith('s')
  ) {
    return RelationType.ONE_TO_MANY;
  }

  // Default to many-to-one as it's the most common case
  return RelationType.MANY_TO_ONE;
}
