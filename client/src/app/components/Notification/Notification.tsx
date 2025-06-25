'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Notification.module.css';

interface NotificationProps {
  message: string;
  version?: number;
  isVisible: boolean;
  type?: 'success' | 'info';
}

export const Notification: React.FC<NotificationProps> = ({ 
  message, 
  version, 
  isVisible, 
  type = 'success' 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`${styles.notification} ${styles[type]}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <span className={styles.icon}>
            {type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 18.333a8.333 8.333 0 100-16.666 8.333 8.333 0 000 16.666z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.667 10l2.5 2.5 4.166-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 18.333a8.333 8.333 0 100-16.666 8.333 8.333 0 000 16.666z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 6.667v3.333M10 13.333h.008"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <div className={styles.message}>
            {message}
            {version !== undefined && (
              <span className={styles.version}>v{version}</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
