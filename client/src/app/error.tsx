'use client';

import React from 'react';
import Link from 'next/link';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorTitle}>Something went wrong</h1>
        <p className={styles.errorMessage}>
          We encountered an error while loading this page. Please try again or return to the home page.
        </p>
        <div className={styles.errorActions}>
          <button 
            onClick={() => reset()}
            className={styles.resetButton}
          >
            Try Again
          </button>
          <Link href="/" className={styles.homeLink}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
