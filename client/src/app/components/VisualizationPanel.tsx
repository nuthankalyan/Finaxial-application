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

// Add this ErrorBoundary component if it doesn't already exist
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log the error to an error reporting service
    console.error('Chart rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Add this ChartRenderer component to safely render each chart type
const ChartRenderer = ({ chart }: { chart: ChartData }) => {
  // Validate chart data structure to prevent runtime errors
  const isValidChart = chart && 
    chart.data && 
    chart.data.datasets && 
    Array.isArray(chart.data.datasets) && 
    chart.data.datasets.length > 0 &&
    chart.data.labels &&
    Array.isArray(chart.data.labels);

  if (!isValidChart) {
    return (
      <div className={styles.chartError}>
        <p>Unable to render this chart due to invalid data structure</p>
      </div>
    );
  }

  try {
    // Ensure chart options exist with maintainAspectRatio set to false
    const options = {
      ...chart.options,
      responsive: true,
      maintainAspectRatio: false, // This ensures the chart respects our fixed height
    };
    
    // For bar charts, add datalabels configuration if not present
    if (chart.type === 'bar' && options.plugins && !options.plugins.datalabels) {
      if (!options.plugins) options.plugins = {};
      options.plugins.datalabels = {
        anchor: 'end',
        align: 'top',
        font: {
          weight: 'bold'
        }
      };
    }

    // Render appropriate chart based on type
    switch (chart.type.toLowerCase()) {
      case 'bar':
        return <Bar data={chart.data} options={options} className="chart-canvas" />;
      case 'line':
        return <Line data={chart.data} options={options} className="chart-canvas" />;
      case 'pie':
        return <Pie data={chart.data} options={options} className="chart-canvas" />;
      case 'doughnut':
        return <Doughnut data={chart.data} options={options} className="chart-canvas" />;
      case 'radar':
        return <Radar data={chart.data} options={options} className="chart-canvas" />;
      default:
        return <Bar data={chart.data} options={options} className="chart-canvas" />;
    }
  } catch (error) {
    console.error('Error rendering chart:', error);
    return (
      <div className={styles.chartError}>
        <p>Error rendering chart: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

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
    
    return (
      <ChartErrorBoundary fallback={
        <div className={styles.chartError}>
          <p>Error rendering this chart. Please try a different visualization.</p>
        </div>
      }>
        <ChartRenderer chart={chart} />
      </ChartErrorBoundary>
    );
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
            <div className={styles.chartWrapper}>
              {renderChart(charts[activeChart])}
            </div>
            <div className={styles.chartDescription}>
              <p>{charts[activeChart].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 