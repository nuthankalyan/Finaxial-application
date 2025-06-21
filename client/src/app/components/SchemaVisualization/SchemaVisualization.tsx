'use client';

import React, { useRef, useState, useMemo } from 'react';
import styles from './SchemaVisualization.module.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { detectRelationships } from '../../utils/schemaRelationships';
import './schema-visualization.css';

import type { TableSchema } from '../../types/schema';
import { RelationType } from '../../types/relationships';

interface SchemaVisualizationProps {
  tables: TableSchema[];
}

export const SchemaVisualization: React.FC<SchemaVisualizationProps> = ({ tables }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  
  // Detect relationships between tables
  const relationships = useMemo(() => detectRelationships(tables), [tables]);

  // Calculate positions for tables in a grid layout
  const getTablePosition = (index: number, totalTables: number) => {
    const columns = Math.ceil(Math.sqrt(totalTables));
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      x: col * 300 + 50,
      y: row * 300 + 50
    };
  };

  // Generate paths for relationships between tables
  const getRelationshipPath = (
    startTable: number,
    startField: number,
    endTable: number,
    endField: number
  ) => {
    const start = getTablePosition(startTable, tables.length);
    const end = getTablePosition(endTable, tables.length);

    // Calculate field positions
    const startY = start.y + 40 + startField * 30 + 15; // 40px header + field height/2
    const endY = end.y + 40 + endField * 30 + 15;

    // If tables are in same column
    if (Math.abs(start.x - end.x) < 300) {
      const midX = start.x + 125; // Center of table width
      return `M ${start.x + 250} ${startY} 
              C ${midX + 100} ${startY},
                ${midX + 100} ${endY},
                ${end.x} ${endY}`;
    }

    // If target table is to the right
    if (end.x > start.x) {
      return `M ${start.x + 250} ${startY}
              C ${start.x + 300} ${startY},
                ${end.x - 50} ${endY},
                ${end.x} ${endY}`;
    }

    // If target table is to the left
    return `M ${start.x} ${startY}
            C ${start.x - 50} ${startY},
              ${end.x + 300} ${endY},
              ${end.x + 250} ${endY}`;
  };

  // Generate relationship label based on type
  const getRelationshipLabel = (type: RelationType): string => {
    switch (type) {
      case RelationType.ONE_TO_ONE:
        return '1:1';
      case RelationType.ONE_TO_MANY:
        return '1:N';
      case RelationType.MANY_TO_ONE:
        return 'N:1';
      case RelationType.MANY_TO_MANY:
        return 'N:M';
      default:
        return '';
    }
  };

  return (
    <div className={styles.visualizationContainer}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit={true}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <svg ref={svgRef} width="100%" height="100%" className={styles.svg}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#94a3b8"
                  className={styles.arrowhead}
                />
              </marker>
            </defs>
            
            {/* Draw relationships first so they appear behind tables */}
            <g className={styles.relationships}>
              {relationships.map((relation) => {
                const fromTableIndex = tables.findIndex(t => t.name === relation.fromTable);
                const toTableIndex = tables.findIndex(t => t.name === relation.toTable);
                
                if (fromTableIndex === -1 || toTableIndex === -1) return null;

                const fromFieldIndex = tables[fromTableIndex].fields.findIndex(
                  f => f.name === relation.fromField
                );
                const toFieldIndex = tables[toTableIndex].fields.findIndex(
                  f => f.name === relation.toField
                );

                if (fromFieldIndex === -1 || toFieldIndex === -1) return null;

                const relationId = `${relation.fromTable}-${relation.fromField}-${relation.toTable}-${relation.toField}`;

                // Calculate start and end positions
                const fromPos = getTablePosition(fromTableIndex, tables.length);
                const toPos = getTablePosition(toTableIndex, tables.length);

                // Calculate field positions
                const fromY = fromPos.y + 40 + fromFieldIndex * 30;
                const toY = toPos.y + 40 + toFieldIndex * 30;

                // Create curve path with arrow
                const path = `
                  M ${fromPos.x + 250} ${fromY}
                  C ${fromPos.x + 350} ${fromY},
                    ${toPos.x - 100} ${toY},
                    ${toPos.x} ${toY}
                `;

                return (
                  <g key={relationId}>
                    <path
                      d={path}
                      className={`${styles.relationshipPath} ${
                        hoveredRelation === relationId ? styles.relationshipPathHighlighted : ''
                      }`}
                      onMouseEnter={() => setHoveredRelation(relationId)}
                      onMouseLeave={() => setHoveredRelation(null)}
                    />
                    
                    {/* Add relationship type label */}
                    <text
                      x={(fromPos.x + toPos.x) / 2}
                      y={(fromPos.y + toPos.y) / 2 - 10}
                      className={styles.relationshipLabel}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {getRelationshipLabel(relation.type)}
                    </text>

                    {/* Add junction table label for many-to-many */}
                    {relation.through && (
                      <text
                        x={(fromPos.x + toPos.x) / 2}
                        y={(fromPos.y + toPos.y) / 2 + 10}
                        className={styles.junctionTableLabel}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        via {relation.through.tableName}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Draw tables on top of relationships */}
            {tables.map((table, index) => {
              const position = getTablePosition(index, tables.length);
              return (
                <g
                  key={table.name}
                  transform={`translate(${position.x}, ${position.y})`}
                  className={styles.table}
                >
                  {/* Table header */}
                  <rect width="250" height="40" rx="4" className={styles.tableHeader} />
                  <text x="20" y="25" className={styles.tableName}>
                    {table.name}
                  </text>

                  {/* Table body */}
                  <rect
                    y="40"
                    width="250"
                    height={table.fields.length * 30}
                    className={styles.tableBody}
                  />

                  {/* Fields */}
                  {table.fields.map((field, fieldIndex) => (
                    <g
                      key={field.name}
                      transform={`translate(0, ${40 + fieldIndex * 30})`}
                    >
                      <text x="20" y="20" className={styles.fieldName}>
                        {field.name}
                        {field.isPrimary && <tspan className={styles.primaryKey}> 🔑</tspan>}
                        {field.isForeign && <tspan className={styles.foreignKey}> 🔗</tspan>}
                      </text>
                      <text x="230" y="20" className={styles.fieldType}>
                        {field.type}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
