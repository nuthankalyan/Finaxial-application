'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './InsightCards.module.css';

export interface InsightCardData {
  value: string | number;
  label: string;
  change?: {
    value: number;
    positive: boolean;
  };
  icon?: React.ReactNode;
}

interface InsightCardsProps {
  cards: InsightCardData[];
}

export default function InsightCards({ cards }: InsightCardsProps) {
  return (
    <div className={styles.cardsContainer}>
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardValue}>
              {card.value}
              {card.change && (
                <span className={`${styles.change} ${card.change.positive ? styles.positive : styles.negative}`}>
                  {card.change.positive ? '+' : '-'}{Math.abs(card.change.value)}%
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={styles.changeIcon}
                  >
                    {card.change.positive ? (
                      <polyline points="18 15 12 9 6 15"></polyline>
                    ) : (
                      <polyline points="6 9 12 15 18 9"></polyline>
                    )}
                  </svg>
                </span>
              )}
            </div>
            <div className={styles.cardLabel}>{card.label}</div>
          </div>
          {card.icon && <div className={styles.cardIcon}>{card.icon}</div>}
        </motion.div>
      ))}
    </div>
  );
} 