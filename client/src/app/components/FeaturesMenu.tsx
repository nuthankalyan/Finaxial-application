'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './FeaturesMenu.module.css';

export default function FeaturesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Add console log for debugging
  useEffect(() => {
    console.log("Features menu isOpen state:", isOpen);
  }, [isOpen]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const features = [
    {
      name: 'Anomaly Detection',
      path: '/features/anomaly-detection',
      description: 'AI-powered detection of unusual patterns in financial data'
    },
    {
      name: 'Compliance Automation',
      path: '/features/compliance-automation',
      description: 'Automated regulatory compliance checks and reporting'
    },
    {
      name: 'Tax Optimization',
      path: '/features/tax-optimization',
      description: 'Intelligent tax planning and optimization strategies'
    },
    {
      name: 'Financial Reporting',
      path: '/features/financial-reporting',
      description: 'Comprehensive financial reporting and analysis tools'
    },
    {
      name: 'Data Transformation',
      path: '/features/data-transformation',
      description: 'Convert and normalize financial data from multiple sources'
    },
  ];

  return (
    <div className={styles.featuresMenuContainer} ref={dropdownRef}>
      <button 
        className={styles.featuresButton}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Features
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`}
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className={styles.featuresDropdown}>
          <div className={styles.dropdownArrow}></div>
          {features.map((feature, index) => (
            <Link 
              href={feature.path} 
              key={index}
              className={styles.featureItem}
              onClick={() => setIsOpen(false)}
            >
              <div className={styles.featureName}>{feature.name}</div>
              <div className={styles.featureDescription}>{feature.description}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
