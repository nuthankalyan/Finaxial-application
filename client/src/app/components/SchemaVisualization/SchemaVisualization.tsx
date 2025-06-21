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

  // Calculate maximum number of fields in any table
  const maxFields = useMemo(() => 
    Math.max(...tables.map(table => table.fields.length)), [tables]
  );

  // Calculate table dimensions based on content
  const getTableDimensions = (table: TableSchema) => {
    const width = Math.max(250, Math.max(...table.fields.map(f => f.name.length * 8 + 60)));
    const height = 40 + table.fields.length * 30; // Header height + field heights
    return { width, height };
  };

  // Calculate positions for tables in a grid layout with dynamic sizing
  const getTablePosition = (index: number, totalTables: number) => {
    const columns = Math.ceil(Math.sqrt(totalTables));
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // Calculate maximum width in this column
    const tablesInColumn = tables.filter((_, i) => (i % columns) === col);
    const maxWidthInColumn = Math.max(...tablesInColumn.map(t => getTableDimensions(t).width));
    
    // Calculate x position based on maximum widths of previous columns
    let x = 50; // Initial margin
    for (let i = 0; i < col; i++) {
      const tablesInPrevColumn = tables.filter((_, idx) => (idx % columns) === i);
      const maxWidthInPrevColumn = Math.max(...tablesInPrevColumn.map(t => getTableDimensions(t).width));
      x += maxWidthInPrevColumn + 50; // Add margin between columns
    }

    // Calculate y position with proper spacing
    const y = row * (maxFields * 30 + 100) + 50;

    return { x, y };
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
    const startDimensions = getTableDimensions(tables[startTable]);
    const endDimensions = getTableDimensions(tables[endTable]);

    // Calculate field positions
    const startY = start.y + 40 + startField * 30 + 15;
    const endY = end.y + 40 + endField * 30 + 15;

    // If tables are in same column
    if (Math.abs(start.x - end.x) < 50) {
      const midX = start.x + startDimensions.width / 2;
      return `M ${start.x + startDimensions.width} ${startY} 
              C ${midX + 100} ${startY},
                ${midX + 100} ${endY},
                ${end.x} ${endY}`;
    }

    // If target table is to the right
    if (end.x > start.x) {
      return `M ${start.x + startDimensions.width} ${startY}
              C ${start.x + startDimensions.width + 50} ${startY},
                ${end.x - 50} ${endY},
                ${end.x} ${endY}`;
    }

    // If target table is to the left
    return `M ${start.x} ${startY}
            C ${start.x - 50} ${startY},
              ${end.x + endDimensions.width + 50} ${endY},
              ${end.x + endDimensions.width} ${endY}`;
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

  // Calculate SVG dimensions based on table layout
  const svgDimensions = useMemo(() => {
    const columns = Math.ceil(Math.sqrt(tables.length));
    const rows = Math.ceil(tables.length / columns);
    
    let maxX = 0;
    let maxY = 0;
    
    tables.forEach((table, index) => {
      const pos = getTablePosition(index, tables.length);
      const dim = getTableDimensions(table);
      maxX = Math.max(maxX, pos.x + dim.width);
      maxY = Math.max(maxY, pos.y + dim.height);
    });
    
    return {
      width: maxX + 100, // Add margin
      height: maxY + 100 // Add margin
    };
  }, [tables]);

  return (
    <div className={styles.visualizationContainer}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit={true}
        wheel={{ disabled: true }} // Disable zoom on wheel to allow natural scrolling
      >
        <TransformComponent
          wrapperClass={styles.transformWrapper}
          contentClass={styles.transformComponent}
          wrapperStyle={{ width: '100%', height: '100%', overflow: 'auto' }}
        >
          <svg 
            ref={svgRef} 
            width={Math.max(svgDimensions.width, 800)} // Minimum width to ensure scrolling works
            height={Math.max(svgDimensions.height, 600)} // Minimum height to ensure scrolling works
            className={styles.schemaCanvas}
            preserveAspectRatio="xMinYMin meet"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
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

                const path = getRelationshipPath(
                  fromTableIndex,
                  fromFieldIndex,
                  toTableIndex,
                  toFieldIndex
                );

                const fromPos = getTablePosition(fromTableIndex, tables.length);
                const toPos = getTablePosition(toTableIndex, tables.length);

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
              const dimensions = getTableDimensions(table);
              return (
                <g
                  key={table.name}
                  transform={`translate(${position.x}, ${position.y})`}
                  className={styles.table}
                >
                  {/* Table header */}
                  <rect width={dimensions.width} height="40" rx="4" className={styles.tableHeader} />
                  <text x="20" y="25" className={styles.tableName}>
                    {table.name}
                  </text>

                  {/* Table body */}
                  <rect
                    y="40"
                    width={dimensions.width}
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
                      <text x={dimensions.width - 20} y="20" className={styles.fieldType}>
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
