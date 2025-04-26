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
  Filler,
  ChartTypeRegistry
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';
import styles from './VisualizationHistory.module.css';

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

interface VisualizationHistoryProps {
  charts: any[];
  fileName: string;
}

export default function VisualizationHistory({ charts, fileName }: VisualizationHistoryProps) {
  const [activeChart, setActiveChart] = useState<number>(0);

  if (!charts || charts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No visualizations available</p>
      </div>
    );
  }

  const processChartOptions = (chart: any) => {
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
          weight: 'bold',
          size: 10
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

  const renderChart = (chart: any) => {
    // Process options to ensure data labels are configured
    const processedOptions = processChartOptions(chart);
    
    switch (chart.type) {
      case 'bar':
        return <Bar data={chart.data} options={processedOptions} className="chart-canvas" />;
      case 'line':
        return <Line data={chart.data} options={processedOptions} className="chart-canvas" />;
      case 'pie':
        return <Pie data={chart.data} options={processedOptions} className="chart-canvas" />;
      case 'doughnut':
        return <Doughnut data={chart.data} options={processedOptions} className="chart-canvas" />;
      case 'radar':
        return <Radar data={chart.data} options={processedOptions} className="chart-canvas" />;
      default:
        return <Bar data={chart.data} options={processedOptions} className="chart-canvas" />;
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Visualizations for {fileName}</h3>
      
      <div className={styles.chartSelector}>
        {charts.map((chart, index) => (
          <button
            key={index}
            className={`${styles.chartTab} ${activeChart === index ? styles.activeChartTab : ''}`}
            onClick={() => setActiveChart(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className={styles.chartContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.chart}
          >
            {renderChart(charts[activeChart])}
            <div className={styles.chartDescription}>
              <p className={styles.chartTitle}>{charts[activeChart].title}</p>
              <p className={styles.description}>{charts[activeChart].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 