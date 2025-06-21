'use client';

import React from 'react';
import { SchemaPreviewModal } from './SchemaPreviewModal';
import type { TableSchema } from '@/app/types/schema';

interface SchemaPreviewModalWrapperProps {
  isOpen: boolean;
  onCloseAction: () => void;
  tables: TableSchema[];
}

export function SchemaPreviewModalWrapper({ 
  isOpen, 
  onCloseAction, 
  tables 
}: SchemaPreviewModalWrapperProps) {
  return (
    <SchemaPreviewModal
      isOpen={isOpen}
      onClose={onCloseAction}
      tables={tables}
    />
  );
}
