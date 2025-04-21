'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import styles from './StoryMode.module.css';
import { generateStory } from '../services/geminiService';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
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

// Register ChartJS components
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
  Filler
);

interface StoryModeProps {
  csvData: string | null;
  fileName: string | null;
  insights: {
    summary: string;
    insights: string[];
    recommendations: string[];
  } | null;
  isEnabled: boolean;
  chartData?: any[]; // Add chart data prop
}

// Interface for presentation slides
interface PresentationSlide {
  chart: any;
  narrativePoints: string[];
}

// Interface for presentation structure
interface Presentation {
  id: string;
  title: string;
  summary: string;
  slides: PresentationSlide[];
}

// Presentation slide component - handles animations and narration
const PresentationSlide: React.FC<{
  slide: PresentationSlide;
  isActive: boolean;
  onComplete: () => void;
}> = ({ slide, isActive, onComplete }) => {
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const slideControls = useAnimation();
  const pointControls = useAnimation();
  const totalPoints = slide.narrativePoints.length;

  useEffect(() => {
    if (!isActive) return;

    let timer: NodeJS.Timeout;
    if (isPlaying) {
      // Initial slide animation
      slideControls.start({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { 
          type: 'spring', 
          stiffness: 50, 
          damping: 20 
        }
      });

      // Animate through narrative points
      if (currentPoint < totalPoints) {
        // Animate current point
        pointControls.start({
          opacity: 1,
          x: 0,
          transition: { 
            type: 'spring', 
            stiffness: 100, 
            damping: 15 
          }
        });

        // Progress to next point after delay
        timer = setTimeout(() => {
          if (currentPoint < totalPoints - 1) {
            // Fade out current point
            pointControls.start({
              opacity: 0,
              x: -50,
              transition: { duration: 0.5 }
            }).then(() => {
              setCurrentPoint(prev => prev + 1);
            });
          } else {
            // Last point - complete this slide
            setTimeout(() => {
              slideControls.start({
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.8 }
              }).then(() => {
                onComplete();
              });
            }, 2000); // Show last point for 2 seconds before exiting
          }
        }, 3500); // Each point shows for 3.5 seconds
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, isPlaying, currentPoint, totalPoints, slideControls, pointControls, onComplete]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    onComplete();
  };

  // Render the appropriate chart based on type
  const renderChart = (chartInfo: any) => {
    if (!chartInfo) return null;
    
    const chartOptions = {
      ...chartInfo.options,
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      },
      responsive: true,
      maintainAspectRatio: false
    };
    
    switch (chartInfo.type) {
      case 'line':
        return <Line data={chartInfo.data} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartInfo.data} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartInfo.data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={chartInfo.data} options={chartOptions} />;
      case 'radar':
        return <Radar data={chartInfo.data} options={chartOptions} />;
      default:
        return <Bar data={chartInfo.data} options={chartOptions} />;
    }
  };

  return (
    <div className={styles.presentationSlide}>
      <motion.div 
        className={styles.slideContent}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={slideControls}
      >
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>{slide.chart.title}</h3>
          <div className={styles.chartWrapper}>
            {renderChart(slide.chart)}
          </div>
        </div>
        
        <motion.div className={styles.narrativePointContainer}>
          <motion.div 
            className={styles.narrativePoint}
            initial={{ opacity: 0, x: 50 }}
            animate={pointControls}
          >
            {slide.narrativePoints[currentPoint]}
          </motion.div>
        </motion.div>
      </motion.div>
      
      <div className={styles.presentationControls}>
        <div className={styles.progressIndicator}>
          {slide.narrativePoints.map((_, i) => (
            <div 
              key={i} 
              className={`${styles.progressDot} ${i === currentPoint ? styles.activeDot : ''}`}
            />
          ))}
        </div>
        
        <div className={styles.controlButtons}>
          <button className={styles.controlButton} onClick={handlePlayPause}>
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>
          
          <button className={styles.controlButton} onClick={handleSkip}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main StoryMode component
const StoryMode: React.FC<StoryModeProps> = ({ csvData, fileName, insights, isEnabled, chartData = [] }) => {
  // Add direct prop logging
  useEffect(() => {
    console.log("StoryMode props received:", {
      csvData: csvData ? "present" : "missing",
      fileName: fileName || "missing",
      insights: insights ? "present" : "missing",
      isEnabled,
      chartData: chartData ? `${chartData.length} charts` : "missing"
    });
  }, [csvData, fileName, insights, isEnabled, chartData]);

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyStyle, setStoryStyle] = useState<'business' | 'casual' | 'dramatic'>('business');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [presentationStarted, setPresentationStarted] = useState(false);
  const [presentationComplete, setPresentationComplete] = useState(false);

  // Generate presentation from insights and chart data
  const generatePresentation = async () => {
    if (!csvData || !insights || !chartData || chartData.length === 0) {
      console.log("StoryMode: Missing required data", { 
        hasCsvData: !!csvData, 
        hasInsights: !!insights, 
        hasChartData: !!chartData,
        chartCount: chartData?.length || 0
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPresentationStarted(false);
    setPresentationComplete(false);
    
    try {
      console.log("StoryMode: Starting presentation generation");
      
      // Get narrative content from AI
      const storyText = await generateStory(csvData, insights, storyStyle);
      console.log("StoryMode: Story text generated successfully");
      
      // Create presentation structure
      const presentationData = createPresentationFromStory(storyText, chartData);
      console.log("StoryMode: Presentation created", { 
        title: presentationData.title,
        slideCount: presentationData.slides.length
      });
      
      setPresentation(presentationData);
      setCurrentSlideIndex(0);
    } catch (err: any) {
      console.error("StoryMode: Error generating presentation", err);
      setError(err.message || 'Failed to generate presentation');
    } finally {
      setIsLoading(false);
    }
  };

  // Create presentation structure from story text and chart data
  const createPresentationFromStory = (storyText: string, charts: any[]): Presentation => {
    // Extract key sections from the story text
    const sections = storyText.split(/#{2,3}\s+/)
      .filter(section => section.trim().length > 0);
    
    // Extract titles from headers
    const sectionTitles = storyText.match(/#{2,3}\s+(.*?)(?=\n)/g) || [];
    const titles = sectionTitles.map(title => title.replace(/#{2,3}\s+/, '').trim());
    
    // Extract summary from first section
    const summary = sections[0].split('\n\n')[0] || 'Financial data analysis';
    
    // Create slides for each chart
    const slides: PresentationSlide[] = [];
    
    charts.forEach((chart, index) => {
      // Select appropriate section of text for this chart
      const sectionIndex = Math.min(index + 1, sections.length - 1);
      const section = sections[sectionIndex];
      
      // Break section into sentences for narrative points
      const paragraphs = section.split('\n\n').filter(p => p.trim().length > 0);
      let sentences: string[] = [];
      
      paragraphs.forEach(paragraph => {
        const sentencesInParagraph = paragraph.split(/(?<=[.!?])\s+/);
        sentences = [...sentences, ...sentencesInParagraph.filter(s => s.trim().length > 0)];
      });
      
      // Find sentences relevant to this chart
      const chartKeywords = [
        ...chart.title.toLowerCase().split(' '),
        ...chart.description.toLowerCase().split(' ')
      ].filter(word => word.length > 3);
      
      let relevantSentences = sentences.filter(sentence => 
        chartKeywords.some(keyword => 
          sentence.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // Add generic sentences if needed
      if (relevantSentences.length < 3) {
        const genericSentences = [
          `This ${chart.type} chart shows ${chart.title.toLowerCase()}.`,
          `${chart.description}`,
          `The data reveals important trends in our financial analysis.`,
          `Notice the key patterns displayed in this visualization.`,
          `This provides valuable insights into our financial situation.`
        ];
        
        while (relevantSentences.length < 3) {
          const nextGeneric = genericSentences[relevantSentences.length % genericSentences.length];
          if (!relevantSentences.includes(nextGeneric)) {
            relevantSentences.push(nextGeneric);
          } else {
            break;
          }
        }
      }
      
      // Add slide to presentation
      slides.push({
        chart,
        narrativePoints: relevantSentences.slice(0, 5) // Limit to 5 points per chart
      });
    });
    
    return {
      id: 'financial-presentation',
      title: titles[0] || 'Financial Analysis',
      summary,
      slides
    };
  };

  // Handle slide completion and advance to next
  const handleSlideComplete = () => {
    if (presentation && currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      // End of presentation
      setPresentationComplete(true);
    }
  };

  // Start presentation
  const startPresentation = () => {
    setPresentationStarted(true);
  };

  // Restart presentation
  const restartPresentation = () => {
    setCurrentSlideIndex(0);
    setPresentationStarted(true);
    setPresentationComplete(false);
  };

  // Generate presentation when data is available
  useEffect(() => {
    console.log("StoryMode: Data check", { 
      hasChartData: chartData && chartData.length > 0, 
      chartCount: chartData?.length || 0,
      hasCsvData: !!csvData, 
      hasInsights: !!insights,
      hasPresentation: !!presentation 
    });
    
    if (chartData && chartData.length > 0 && csvData && insights && !presentation) {
      console.log("StoryMode: Generating presentation...");
      generatePresentation();
    }
  }, [csvData, insights, chartData, storyStyle]);

  if (!isEnabled) {
    return (
      <div className={styles.disabledContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={styles.disabledIcon}>
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3z"></path>
        </svg>
        <h3>Presentation Mode</h3>
        <p>Upload financial data to generate an interactive video presentation of your analysis.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Creating your financial presentation...</p>
        <p className={styles.loadingSubtext}>Our AI is preparing an engaging video presentation of your financial data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={generatePresentation}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className={styles.emptyState}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
        </svg>
        <h3>No Presentation Available</h3>
        <p>Upload financial data and analyze it to generate a presentation.</p>
      </div>
    );
  }

  if (!presentationStarted) {
    return (
      <div className={styles.presentationIntro}>
        <div className={styles.introContent}>
          <h2>{presentation.title}</h2>
          <p className={styles.introSummary}>{presentation.summary}</p>
          
          <div className={styles.presentationInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Slides:</span>
              <span className={styles.infoValue}>{presentation.slides.length}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Style:</span>
              <span className={styles.infoValue}>{storyStyle}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Data:</span>
              <span className={styles.infoValue}>{fileName || 'Financial dataset'}</span>
            </div>
          </div>
          
          <div className={styles.styleSelector}>
            <span>Presentation Style:</span>
            <div className={styles.styleButtons}>
              <button 
                className={`${styles.styleButton} ${storyStyle === 'business' ? styles.activeStyle : ''}`}
                onClick={() => {
                  if (storyStyle !== 'business') {
                    setStoryStyle('business');
                    generatePresentation();
                  }
                }}
              >
                Business
              </button>
              <button 
                className={`${styles.styleButton} ${storyStyle === 'casual' ? styles.activeStyle : ''}`}
                onClick={() => {
                  if (storyStyle !== 'casual') {
                    setStoryStyle('casual');
                    generatePresentation();
                  }
                }}
              >
                Casual
              </button>
              <button 
                className={`${styles.styleButton} ${storyStyle === 'dramatic' ? styles.activeStyle : ''}`}
                onClick={() => {
                  if (storyStyle !== 'dramatic') {
                    setStoryStyle('dramatic');
                    generatePresentation();
                  }
                }}
              >
                Dramatic
              </button>
            </div>
          </div>
          
          <button 
            className={styles.startButton} 
            onClick={startPresentation}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Start Presentation
          </button>
        </div>
      </div>
    );
  }

  if (presentationComplete) {
    return (
      <div className={styles.presentationComplete}>
        <div className={styles.completeContent}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>Presentation Complete</h2>
          <p>You've reviewed all the financial insights.</p>
          
          <div className={styles.completeActions}>
            <button 
              className={styles.restartButton} 
              onClick={restartPresentation}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v6h6"></path>
                <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
              </svg>
              Restart Presentation
            </button>
            
            <button 
              className={styles.newPresentationButton}
              onClick={generatePresentation}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New Presentation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.presentationContainer}>
      <div className={styles.presentationHeader}>
        <h3>{presentation.title}</h3>
        <div className={styles.slideIndicator}>
          <span>Slide {currentSlideIndex + 1} of {presentation.slides.length}</span>
        </div>
      </div>
      
      <div className={styles.presentationViewport}>
        <PresentationSlide
          slide={presentation.slides[currentSlideIndex]}
          isActive={true}
          onComplete={handleSlideComplete}
        />
      </div>
    </div>
  );
};

export default StoryMode; 