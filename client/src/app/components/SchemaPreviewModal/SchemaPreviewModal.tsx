import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaVisualization } from '../SchemaVisualization/SchemaVisualization';
import styles from './SchemaPreviewModal.module.css';

import type { TableSchema } from '../../types/schema';

interface SchemaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableSchema[];
}

export const SchemaPreviewModal: React.FC<SchemaPreviewModalProps> = ({
  isOpen,
  onClose,
  tables
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          <div className={styles.modalHeader}>
            <h2>
              <span className={styles.icon}>🔍</span>
              Database Schema Visualization
            </h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close preview"
            >
              ×
            </button>
          </div>

          <div className={styles.visualizationContainer}>
            <SchemaVisualization tables={tables} />
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.zoomHelp}>
              <p>
                🖱️ Use mouse wheel to zoom in/out
                <br />
                👆 Drag to pan
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
