'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const loadingMessages = [
  "Processing your files...",
  "Analysing...",
  "Preparing assistant...",
  "Visualizing..."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [isVisible]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.content}>
            <div className={styles.spinner} />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMessageIndex}
                className={styles.message}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {loadingMessages[currentMessageIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
