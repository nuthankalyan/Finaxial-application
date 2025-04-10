'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartData } from '../services/geminiService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';
import styles from './VisualizationPanel.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

interface VisualizationPanelProps {
  charts: ChartData[] | null;
  fileName: string | null;
  isLoading: boolean;
}

export default function VisualizationPanel({ charts, fileName, isLoading }: VisualizationPanelProps) {
  const [activeChart, setActiveChart] = useState<number>(0);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Generating visualizations...</p>
      </div>
    );
  }

  if (!charts || charts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg xmlns="http://www.w3.org/2000/svg" className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        <h3>No visualizations available</h3>
        <p>Upload financial data to generate interactive charts</p>
      </div>
    );
  }

  const processChartOptions = (chart: ChartData) => {
    // Make sure we have a base options object
    const options = chart.options || {};
    
    // For bar charts, ensure we have data labels configured
    if (chart.type === 'bar') {
      // Configure global defaults for the datalabels plugin
      options.plugins = options.plugins || {};
      options.plugins.datalabels = options.plugins.datalabels || {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: (value: number) => value.toLocaleString(),
        font: {
          weight: 'bold'
        },
        color: '#404040'
      };
      
      // Make sure tooltips are enabled
      options.plugins.tooltip = options.plugins.tooltip || { enabled: true };
      
      // Make sure scales is defined for bar charts
      options.scales = options.scales || {
        y: {
          beginAtZero: true
        }
      };
    } else {
      // For other chart types, disable datalabels by default
      options.plugins = options.plugins || {};
      options.plugins.datalabels = options.plugins.datalabels || { display: false };
    }
    
    return options;
  };

  const renderChart = (chart: ChartData) => {
    // Process options to ensure data labels are configured
    const processedOptions = processChartOptions(chart);
    
    switch (chart.type) {
      case 'bar':
        return <Bar data={chart.data} options={processedOptions} />;
      case 'line':
        return <Line data={chart.data} options={processedOptions} />;
      case 'pie':
        return <Pie data={chart.data} options={processedOptions} />;
      case 'doughnut':
        return <Doughnut data={chart.data} options={processedOptions} />;
      case 'radar':
        return <Radar data={chart.data} options={processedOptions} />;
      default:
        return <Bar data={chart.data} options={processedOptions} />;
    }
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className={styles.header}>
        <motion.h3 
          className={styles.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Financial Visualizations
          {fileName && <span className={styles.fileName}>for {fileName}</span>}
        </motion.h3>
      </div>

      <div className={styles.chartSelector}>
        {charts.map((chart, index) => (
          <motion.button
            key={index}
            className={`${styles.chartTab} ${activeChart === index ? styles.activeChartTab : ''}`}
            onClick={() => setActiveChart(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {chart.title}
            {activeChart === index && (
              <motion.div 
                className={styles.activeIndicator}
                layoutId="chartActiveIndicator"
              />
            )}
          </motion.button>
        ))}
      </div>

      <div className={styles.chartContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChart}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.chart}
          >
            {renderChart(charts[activeChart])}
            <div className={styles.chartDescription}>
              <p>{charts[activeChart].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 