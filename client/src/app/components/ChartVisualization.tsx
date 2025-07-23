'use client';

import React from 'react';
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
import styles from './ChartVisualization.module.css';

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

interface ChartVisualizationProps {
  chart: ChartData;
  onExport?: () => void;
}

const ChartVisualization: React.FC<ChartVisualizationProps> = ({ chart, onExport }) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  // Function to export chart as image
  const exportChart = () => {
    // Look for canvas within this specific chart container
    const canvas = chartContainerRef.current?.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        // Create download link
        const link = document.createElement('a');
        link.download = `${chart.title.replace(/[^a-z0-9]/gi, '_')}_chart.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (onExport) onExport();
      } catch (error) {
        console.error('Error exporting chart:', error);
        alert('Failed to export chart. Please try again.');
      }
    } else {
      console.error('Canvas not found for chart export');
      alert('Chart not ready for export. Please wait for the chart to load.');
    }
  };

  // Process chart options for better display
  const processChartOptions = () => {
    const options = {
      ...chart.options,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...chart.options?.plugins,
        title: {
          display: true,
          text: chart.title,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        },
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1
        }
      }
    };

    // Add data labels for bar charts
    if (chart.type === 'bar') {
      options.plugins = {
        ...options.plugins,
        datalabels: {
          display: true,
          anchor: 'end' as const,
          align: 'top' as const,
          formatter: (value: number) => value.toLocaleString(),
          font: {
            weight: 'bold' as const,
            size: 11
          },
          color: '#374151'
        }
      };
    } else {
      // Disable data labels for other chart types
      options.plugins = {
        ...options.plugins,
        datalabels: {
          display: false
        }
      };
    }

    return options;
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    const processedOptions = processChartOptions();
    
    try {
      switch (chart.type.toLowerCase()) {
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
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className={styles.chartError}>
          <p>Error rendering chart: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  };

  return (
    <div className={styles.chartContainer} ref={chartContainerRef}>
      {/* Chart Header */}
      <div className={styles.chartHeader}>
        <h4 className={styles.chartTitle}>{chart.title}</h4>
        <div className={styles.chartActions}>
          <button
            className={styles.exportButton}
            onClick={exportChart}
            title="Export chart as PNG"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export PNG
          </button>
        </div>
      </div>
      
      {/* Chart Display */}
      <div className={styles.chartWrapper}>
        {renderChart()}
      </div>
      
      {/* Chart Description */}
      <div className={styles.chartDescription}>
        <p>{chart.description}</p>
      </div>
    </div>
  );
};

export default ChartVisualization;
