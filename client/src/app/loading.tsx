'use client';

import React from 'react';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Loading Finaxial financial analytics platform...</p>
      </div>
    </div>
  );
}
