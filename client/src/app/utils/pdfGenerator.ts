'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Message } from '../components/FinancialAssistant';

// Define the safe text width boundaries for different content types
const PAGE_MARGINS = {
  LEFT: 20,
  RIGHT: 190,
  USER_TEXT_LEFT: 40,
  ASSISTANT_TEXT_LEFT: 20,
  CODE_TEXT_LEFT: 30,
  TOP: 20,
  BOTTOM: 280 // A4 height is 297mm, leave margin at bottom
};

const getSafeTextWidth = (contentType: 'user' | 'assistant' | 'code'): number => {
  switch (contentType) {
    case 'user':
      return PAGE_MARGINS.RIGHT - PAGE_MARGINS.USER_TEXT_LEFT - 5; // 145 pts
    case 'assistant':
      return PAGE_MARGINS.RIGHT - PAGE_MARGINS.ASSISTANT_TEXT_LEFT - 5; // 165 pts  
    case 'code':
      return PAGE_MARGINS.RIGHT - PAGE_MARGINS.CODE_TEXT_LEFT - 10; // 150 pts
    default:
      return 140;
  }
};

// Helper function to check if we need a new page
const checkPageBreak = (doc: jsPDF, currentY: number, additionalHeight: number = 10): number => {
  if (currentY + additionalHeight > PAGE_MARGINS.BOTTOM) {
    doc.addPage();
    
    // Add a subtle header on continuation pages
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Financial Analysis Report (continued)', PAGE_MARGINS.LEFT, 15);
    
    // Add a subtle divider line 
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(PAGE_MARGINS.LEFT, 17, PAGE_MARGINS.RIGHT, 17);
    
    return PAGE_MARGINS.TOP;
  }
  return currentY;
};

/**
 * Validates that an answer message actually corresponds to the question
 */
function validateQuestionAnswerPair(question: Message, answer: Message): boolean {
  if (!question || !answer || !question.text || !answer.text) {
    return false;
  }

  const questionText = question.text.toLowerCase().trim();
  const answerText = answer.text.toLowerCase().trim();
  
  // Skip validation for very generic answers
  if (answerText.length < 10) {
    return false;
  }
  
  // Extract key terms from the question
  const questionWords = questionText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'how', 'what', 'when', 'where', 'why', 'who'].includes(word));
  
  // Check if the answer contains relevant keywords from the question
  let relevanceScore = 0;
  let totalWords = questionWords.length;
  
  if (totalWords === 0) {
    return true; // If we can't extract meaningful words, assume it's valid
  }
  
  questionWords.forEach(word => {
    if (answerText.includes(word)) {
      relevanceScore++;
    }
  });
  
  // Calculate relevance percentage
  const relevancePercentage = (relevanceScore / totalWords) * 100;
  
  // Check for specific patterns that indicate mismatched content
  const questionHasChart = /chart|graph|plot|visualization|bar|pie|line/.test(questionText);
  const answerHasChart = /chart|graph|plot|visualization|bar|pie|line/.test(answerText);
  
  const questionHasFinancial = /financial|amount|account|gl|balance|revenue|expense|profit|loss/.test(questionText);
  const answerHasFinancial = /financial|amount|account|gl|balance|revenue|expense|profit|loss/.test(answerText);
  
  // If question asks for chart but answer doesn't mention charts, likely mismatch
  if (questionHasChart && !answerHasChart && relevancePercentage < 30) {
    return false;
  }
  
  // If question is about financial data but answer doesn't mention financial terms
  if (questionHasFinancial && !answerHasFinancial && relevancePercentage < 20) {
    return false;
  }
  
  // Check timestamp proximity (answers should be close in time to questions)
  if (question.timestamp && answer.timestamp) {
    const timeDiff = Math.abs(answer.timestamp.getTime() - question.timestamp.getTime());
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // If answers are more than 5 minutes apart, might be mismatch
    if (timeDiff > fiveMinutes && relevancePercentage < 40) {
      return false;
    }
  }
  
  // Require at least 15% relevance for validation (adjustable threshold)
  const RELEVANCE_THRESHOLD = 15;
  const confidenceLevel = relevancePercentage >= 50 ? 'High' : 
                         relevancePercentage >= 30 ? 'Medium' : 'Low';
  
  console.log(`Q&A Validation: ${relevancePercentage.toFixed(1)}% relevance (${confidenceLevel} confidence)`);
  
  return relevancePercentage >= RELEVANCE_THRESHOLD;
}

interface PDFGenerationOptions {
  title?: string;
  filename?: string;
  includeTimestamp?: boolean;
  includeCharts?: boolean;
}

/**
 * Helper function to add a visualization inline with the conversation
 */
async function addInlineVisualization(
  doc: jsPDF, 
  canvas: HTMLCanvasElement, 
  currentY: number, 
  chartNumber: number
): Promise<number> {
  if (!canvas) {
    console.warn(`Chart ${chartNumber} canvas is null, skipping visualization`);
    return currentY;
  }
  
  console.log(`Processing chart ${chartNumber}: ${canvas.width}x${canvas.height}`);
  
  // Check if we need a new page (leave space for chart + title + some margin)
  currentY = checkPageBreak(doc, currentY, 120);
  
  try {
    // Add some spacing before the chart
    currentY += 8;
    
    // Convert canvas to high-quality image
    const imgData = canvas.toDataURL('image/png', 1.0);
    console.log(`Chart ${chartNumber} image data length: ${imgData.length}`);
    
    // Calculate optimal dimensions to fit within the page
    const canvasAspect = canvas.width / canvas.height;
    const maxWidth = 160;
    const maxHeight = 90; // Reduced height to fit better inline
    
    let imgWidth = maxWidth;
    let imgHeight = imgWidth / canvasAspect;
    
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = imgHeight * canvasAspect;
    }
    
    // Center the image
    const imgX = 20 + (170 - imgWidth) / 2;
    
    // Add subtle background and border around chart
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(imgX - 3, currentY - 3, imgWidth + 6, imgHeight + 6, 2, 2, 'FD');
    
    // Add image to PDF
    doc.addImage(imgData, 'PNG', imgX, currentY, imgWidth, imgHeight);
    
    console.log(`Successfully added chart ${chartNumber} to PDF`);
    
    // Update Y position after the chart
    currentY += imgHeight + 8;
    
    // Add separator line to separate from next content
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(20, currentY, 190, currentY);
    currentY += 8;
    
  } catch (error) {
    console.error('Error adding inline chart to PDF:', error);
    
    // Try to create a simple chart representation if the canvas is valid but export failed
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      // Add a descriptive chart placeholder
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.roundedRect(20, currentY, 170, 80, 3, 3, 'FD');
      
      // Add chart icon representation
      doc.setFillColor(59, 130, 246);
      doc.setDrawColor(59, 130, 246);
      
      // Draw simple bar chart representation
      const barWidth = 8;
      const barSpacing = 4;
      const startX = 105 - 24; // Center the bars
      for (let i = 0; i < 6; i++) {
        const barHeight = 15 + (i % 3) * 8;
        const barX = startX + i * (barWidth + barSpacing);
        const barY = currentY + 55 - barHeight;
        doc.rect(barX, barY, barWidth, barHeight, 'F');
      }
      
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text(`Financial Chart ${chartNumber}`, 105, currentY + 20, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('Chart data processed - detailed view available in application', 105, currentY + 70, { align: 'center' });
      
      currentY += 85;
    } else {
      // Fallback for completely invalid canvas
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, currentY, 170, 30, 2, 2, 'FD');
      
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('Chart visualization optimized for interactive view', 105, currentY + 18, { align: 'center' });
      currentY += 35;
    }
  }
  
  return currentY;
}

/**
 * Helper function to properly format and wrap text with better spacing
 */
function formatTextForPDF(doc: jsPDF, text: string, maxWidth: number, fontSize: number = 10): string[] {
  doc.setFontSize(fontSize);
  
  // For regular text, clean and normalize but preserve meaningful line breaks
  let cleanText = text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Handle remaining carriage returns
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .replace(/\n[ \t]+/g, '\n') // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n') // Remove trailing whitespace before new lines
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
  
  // Split by double line breaks to preserve paragraphs
  const paragraphs = cleanText.split(/\n\n+/);
  const formattedLines: string[] = [];
  
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.trim()) {
      // Handle single line breaks within paragraphs
      const lines = paragraph.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (line.trim()) {
          // Use jsPDF's built-in splitTextToSize for reliable text wrapping
          const wrappedLines = doc.splitTextToSize(line.trim(), maxWidth);
          formattedLines.push(...wrappedLines);
        } else if (lineIndex < lines.length - 1) {
          formattedLines.push(''); // Preserve empty lines within paragraphs
        }
      });
      
      // Add paragraph spacing (except for the last paragraph)
      if (index < paragraphs.length - 1) {
        formattedLines.push(''); // Empty line for paragraph spacing
      }
    }
  });
  
  return formattedLines;
}

/**
 * Helper function to format code blocks preserving exact formatting and spacing
 */
function formatCodeForPDF(doc: jsPDF, code: string, maxWidth: number, fontSize: number = 9): string[] {
  doc.setFontSize(fontSize);
  
  // For code blocks, preserve the exact formatting - don't modify whitespace or line breaks
  // Split by actual line breaks in the code
  const lines = code.split(/\r?\n/);
  const formattedLines: string[] = [];
  
  lines.forEach(line => {
    // Preserve leading whitespace and special characters exactly as they are
    if (line.length === 0) {
      formattedLines.push(''); // Preserve empty lines
    } else {
      // Check if line fits within bounds
      if (doc.getTextWidth(line) <= maxWidth) {
        // Line fits, keep it as is
        formattedLines.push(line);
      } else {
        // Line is too long, we need to wrap it
        // First, try to break at logical SQL points
        const sqlBreakPoints = [
          ' AND ', ' OR ', ' WHERE ', ' FROM ', ' SELECT ', ' GROUP BY ', ' ORDER BY ',
          ' HAVING ', ' UNION ', ' JOIN ', ' LEFT JOIN ', ' RIGHT JOIN ', ' INNER JOIN ',
          ', ', '; ', ' = ', ' > ', ' < ', ' >= ', ' <= ', ' != ', ' <> '
        ];
        
        let remainingText = line;
        let leadingSpaces = line.match(/^\s*/)?.[0] || '';
        
        while (remainingText.length > 0) {
          let breakPoint = -1;
          let bestBreakPoint = -1;
          
          // Find the longest substring that fits
          for (let i = remainingText.length; i > 0; i--) {
            const testSubstring = remainingText.substring(0, i);
            if (doc.getTextWidth(testSubstring) <= maxWidth) {
              bestBreakPoint = i;
              break;
            }
          }
          
          if (bestBreakPoint === -1) {
            // Even a single character doesn't fit, force break
            formattedLines.push(remainingText.substring(0, 1));
            remainingText = remainingText.substring(1);
            continue;
          }
          
          // Look for a good break point within the fitting text
          const fittingText = remainingText.substring(0, bestBreakPoint);
          
          // Try to find SQL break points
          for (const breakString of sqlBreakPoints) {
            const lastIndex = fittingText.lastIndexOf(breakString);
            if (lastIndex > 0) {
              breakPoint = lastIndex + breakString.length;
              break;
            }
          }
          
          // If no SQL break point found, try space
          if (breakPoint === -1) {
            const lastSpaceIndex = fittingText.lastIndexOf(' ');
            if (lastSpaceIndex > 0) {
              breakPoint = lastSpaceIndex + 1;
            }
          }
          
          // If still no good break point, use the maximum fitting length
          if (breakPoint === -1) {
            breakPoint = bestBreakPoint;
          }
          
          // Add the line segment
          const lineSegment = remainingText.substring(0, breakPoint).trimEnd();
          
          // Safety check: ensure the line doesn't exceed maxWidth
          if (doc.getTextWidth(lineSegment) > maxWidth) {
            // Force break at character level if needed
            for (let i = lineSegment.length - 1; i > 0; i--) {
              const truncated = lineSegment.substring(0, i);
              if (doc.getTextWidth(truncated) <= maxWidth) {
                formattedLines.push(truncated);
                remainingText = leadingSpaces + '  ' + lineSegment.substring(i) + remainingText.substring(breakPoint);
                break;
              }
            }
          } else {
            formattedLines.push(lineSegment);
            // Update remaining text and preserve indentation for continuation lines
            remainingText = leadingSpaces + '  ' + remainingText.substring(breakPoint).trimStart();
          }
          
          // Safety check to prevent infinite loop
          if (remainingText.trim().length === 0) {
            break;
          }
        }
      }
    }
  });
  
  return formattedLines;
}

/**
 * Generates a PDF from Financial Assistant chat history with inline visualizations
 */
export const generateChatPDF = async (
  messages: Message[],
  visualizations?: HTMLCanvasElement[], 
  fileName?: string,
  options?: PDFGenerationOptions
): Promise<void> => {
  // Initialize PDF document with better margins and ensure clean state
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Set default colors to ensure clean state
  doc.setFillColor(255, 255, 255); // White fill
  doc.setDrawColor(0, 0, 0); // Black stroke
  doc.setTextColor(0, 0, 0); // Black text
  
  const defaultOptions: PDFGenerationOptions = {
    title: 'Financial Assistant Analysis Report',
    filename: fileName ? `${fileName}-financial-assistant-analysis-report.pdf` : 'financial-assistant-analysis-report.pdf',
    includeTimestamp: true,
    includeCharts: visualizations && visualizations.length > 0, // Only include charts if we have them
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Add professional header with branding
  doc.setFillColor(78, 113, 255); // Brand blue
  doc.rect(0, 0, 210, 25, 'F');
  
  // Add title with better formatting
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(config.title!, 20, 16);
  
  // Add Finaxial branding
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Powered by Finaxial AI', 145, 20);
  
  // Add date and file info with better styling
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Generated: ${today}`, 20, 35);
  
  // Add file information if available
  if (fileName) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Source: ${fileName}`, 20, 42);
  }
  
  let yPos = 50;
  
  // Add a professional divider line
  doc.setDrawColor(78, 113, 255);
  doc.setLineWidth(0.5);
  doc.line(20, yPos - 2, 190, yPos - 2);
  yPos += 5;
  
  // Filter out typing indicators and only include actual messages
  const filteredMessages = messages.filter(m => m.text !== '...' && m.text.trim().length > 0);
  
  // Create proper question-answer pairs to ensure matching
  const questionAnswerPairs: { question: Message, answer: Message | null, isValidPair: boolean }[] = [];
  
  for (let i = 0; i < filteredMessages.length; i++) {
    const message = filteredMessages[i];
    
    if (message.sender === 'user') {
      // Look for the next assistant message as the answer
      let answerMessage: Message | null = null;
      for (let j = i + 1; j < filteredMessages.length; j++) {
        if (filteredMessages[j].sender === 'assistant') {
          answerMessage = filteredMessages[j];
          break;
        }
      }
      
      // Validate that the answer is actually responding to this question
      let isValidPair = false;
      if (answerMessage) {
        isValidPair = validateQuestionAnswerPair(message, answerMessage);
      }
      
      // Only include pairs where we have both question and answer and they match
      if (answerMessage && isValidPair) {
        questionAnswerPairs.push({ question: message, answer: answerMessage, isValidPair: true });
      } else if (answerMessage) {
        // Log mismatched pairs for debugging
        console.warn('Mismatched Q&A pair detected:', {
          question: message.text.substring(0, 100),
          answer: answerMessage.text.substring(0, 100)
        });
      }
    }
  }
  
  // Create a map to track which visualization belongs to which answer
  let visualizationIndex = 0;
  const usedVisualizations = new Set<number>(); // Track which visualizations we've used
  
  console.log(`PDF Generator: Processing ${questionAnswerPairs.length} validated Q&A pairs with ${visualizations?.length || 0} visualizations available`);
  console.log(`Filtered out ${filteredMessages.filter(m => m.sender === 'user').length - questionAnswerPairs.length} mismatched question-answer pairs`);
  
  // Process all question-answer pairs to ensure proper matching
  for (let pairIndex = 0; pairIndex < questionAnswerPairs.length; pairIndex++) {
    const { question, answer, isValidPair } = questionAnswerPairs[pairIndex];
    
    console.log(`Processing Q&A pair ${pairIndex + 1}: Valid=${isValidPair}, Question="${question.text.substring(0, 50)}..."`);
    
    // Add spacing between pairs
    if (pairIndex > 0) {
      yPos += 12; // More spacing between Q&A pairs
    }
    
    // Check if we need a new page using the helper function
    yPos = checkPageBreak(doc, yPos, 30);
    
    // Process the user question
    // User message with clean professional styling
    doc.setFillColor(248, 250, 252); // Very light blue-gray
    doc.setDrawColor(203, 213, 225); // Border color
    doc.setLineWidth(0.5);
    
    // Simple clean user message without background boxes
    const userQuestionText = question.text;
    const textLines = formatTextForPDF(doc, userQuestionText, getSafeTextWidth('user'), 10);
    
    // Check if content will fit on current page
    const estimatedHeight = textLines.length * 7 + 15;
    yPos = checkPageBreak(doc, yPos, estimatedHeight);
    
    // Add "Question:" label with clean styling and validation indicator
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Question:', 40, yPos + 5);
    
      // Add confidence level indicator (optional, for debugging)
      if (isValidPair) {
        // Calculate confidence for display (simplified version)
        const questionWords = question.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const answerText = answer?.text.toLowerCase() || '';
        const matchingWords = questionWords.filter(word => answerText.includes(word));
        const confidence = questionWords.length > 0 ? (matchingWords.length / questionWords.length) * 100 : 0;
        
        const confidenceLevel = confidence >= 50 ? 'High' : 
                               confidence >= 30 ? 'Medium' : 'Low';
        
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(`${confidenceLevel} Confidence`, 170, yPos + 12, { align: 'right' });
      }
    
    // Add user text with clean formatting and proper line spacing
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    
    // Render user text lines with proper spacing and page breaks
    let userTextY = yPos + 12;
    textLines.forEach(line => {
      userTextY = checkPageBreak(doc, userTextY, 7);
      if (line.trim()) { // Only render non-empty lines
        doc.text(line, 40, userTextY);
      }
      userTextY += 7; // Slightly increased line height for better readability
    });
    
    // Add a subtle underline instead of a box
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(40, userTextY + 3, 190, userTextY + 3);
    
    yPos = userTextY + 12; // More spacing before answer
    
    // Add chart visualization immediately after the question if available
    if (config.includeCharts && visualizations && visualizations.length > 0 && visualizationIndex < visualizations.length) {
      console.log(`Adding chart ${visualizationIndex + 1} immediately after question`);
      
      // Check if we need a new page for visualization
      yPos = checkPageBreak(doc, yPos, 120);
      
      try {
        // Look for a matching visualization that hasn't been used yet
        let matchingVisualization: HTMLCanvasElement | null = null;
        
        if (visualizationIndex < visualizations.length && !usedVisualizations.has(visualizationIndex)) {
          matchingVisualization = visualizations[visualizationIndex];
          usedVisualizations.add(visualizationIndex);
          
          // Validate that the canvas is properly formed
          if (matchingVisualization && 
              matchingVisualization.width > 0 && 
              matchingVisualization.height > 0) {
            
            console.log(`Successfully adding chart ${visualizationIndex + 1} to PDF after question`);
            yPos = await addInlineVisualization(doc, matchingVisualization, yPos, visualizationIndex + 1);
            visualizationIndex++;
          } else {
            console.warn(`Chart ${visualizationIndex + 1} canvas is invalid, skipping`);
            visualizationIndex++;
          }
        }
        
        // If no valid visualization found and we expected one, show a subtle placeholder
        if (!matchingVisualization || matchingVisualization.width === 0) {
          // Only show placeholder if this seems to be a chart-related question
          const questionText = question.text.toLowerCase();
          const isChartQuestion = questionText.includes('chart') || 
                                questionText.includes('graph') || 
                                questionText.includes('plot') ||
                                questionText.includes('visualization') ||
                                questionText.includes('bar') ||
                                questionText.includes('pie');
          
          if (isChartQuestion) {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.5);
            doc.roundedRect(20, yPos, 170, 40, 2, 2, 'FD');
            
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            doc.text('Chart visualization available in interactive mode', 105, yPos + 20, { align: 'center' });
            yPos += 50;
          }
        }
      } catch (error) {
        console.error('Error processing chart after question:', error);
        // Add error placeholder instead of skipping
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(248, 113, 113);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos, 170, 40, 2, 2, 'FD');
        
        doc.setFontSize(9);
        doc.setTextColor(185, 28, 28);
        doc.text('Chart processing error - please try exporting again', 105, yPos + 20, { align: 'center' });
        yPos += 50;
      }
    }
    
    // Process the assistant answer (only if we have one)
    if (answer) {
      // Add extra spacing after chart if one was added
      yPos += 8;
      
      // Process the assistant message content with enhanced formatting
      const { processedText, codeBlocks, tables } = extractFormattedContent(answer.text);
      
      // Simple clean assistant message without background boxes
      const answerTextLines = formatTextForPDF(doc, processedText, getSafeTextWidth('assistant'), 10);
      
      // Check if content will fit on current page
      const estimatedHeight = answerTextLines.length * 7 + 30;
      yPos = checkPageBreak(doc, yPos, estimatedHeight);
      
      // Add "Analysis:" label with clean styling
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text('Analysis:', 20, yPos + 8);
      
      // Add main content with clean typography and proper line spacing
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      
      // Render text lines with proper spacing and page breaks
      let textY = yPos + 15;
      answerTextLines.forEach(line => {
        textY = checkPageBreak(doc, textY, 7);
        if (line.trim()) { // Only render non-empty lines
          doc.text(line, 20, textY);
        }
        textY += 7; // Slightly increased line height for better readability
      });
      
      // Add a subtle separator line
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(20, textY + 10, 190, textY + 10);
      
      let contentY = textY + 15;
      
      // Add code blocks with clean styling (no background boxes)
      for (const codeBlock of codeBlocks) {
        // Check if we need a new page for the code block header
        contentY = checkPageBreak(doc, contentY, 20);
        
        // Add code block title with clean styling
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`${codeBlock.language.toUpperCase()} Code:`, 25, contentY);
        
        contentY += 8;
        
        // Add code content with exact formatting preservation
        const codeLines = formatCodeForPDF(doc, codeBlock.content, getSafeTextWidth('code'), 9);
        
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(9);
        doc.setFont('Courier', 'normal');
        
        // Render code lines with proper spacing and page breaks
        let lineY = contentY;
        codeLines.forEach(line => {
          lineY = checkPageBreak(doc, lineY, 7);
          if (line.trim() || line === '') { // Render all lines including empty ones for code structure
            doc.text(line, 30, lineY);
          }
          lineY += 7; // Increased line height for better code readability
        });
        
        doc.setFont('Helvetica', 'normal');
        
        // Add separator line with page break check
        lineY = checkPageBreak(doc, lineY, 10);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(25, lineY + 5, 185, lineY + 5);
        
        contentY = lineY + 15;
      }
      
      // Add tables with clean formatting
      for (const table of tables) {
        // Check if we need a new page for the table
        contentY = checkPageBreak(doc, contentY, 40);
        
        // Add simple table title
        doc.setFontSize(10);
        doc.setTextColor(14, 116, 144);
        doc.text("Financial Data Table", 25, contentY);
        
        contentY += 8;
        
        // Prepare enhanced table data with better cell processing
        const formattedHeaders = table.headers.map(h => h.trim());
        const formattedRows = table.rows.map(row => 
          row.map(cell => {
            // Ensure cell is treated as a complete string
            const cellStr = typeof cell === 'string' ? cell : String(cell);
            return formatTableCell(cellStr);
          })
        );
        
        console.log('Table data:', { headers: formattedHeaders, sampleRow: formattedRows[0] });
        
        // Use autoTable with clean, professional styling
        autoTable(doc, {
          startY: contentY,
          head: [formattedHeaders],
          body: formattedRows,
          margin: { left: 25, right: 25 },
          tableWidth: 160,
          styles: { 
            fontSize: 9,
            cellPadding: 4,
            lineWidth: 0.2,
            lineColor: [203, 213, 225],
            textColor: [31, 41, 55],
            halign: 'left',
            fillColor: [255, 255, 255] // Ensure white background
          },
          headStyles: {
            fillColor: [248, 250, 252], // Very light background
            textColor: [30, 64, 175],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [252, 253, 254] // Very subtle alternating rows
          },
          didParseCell: (data) => {
            // Enhanced cell formatting
            if (data.section === 'body') {
              const content = data.cell.raw?.toString() || '';
              
              // Check if content is a date format
              const datePatterns = [
                /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
                /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY
                /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
                /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
              ];
              
              if (datePatterns.some(pattern => pattern.test(content.trim()))) {
                // Center-align dates
                data.cell.styles.halign = 'center';
                data.cell.styles.fontStyle = 'normal';
                data.cell.styles.textColor = [31, 41, 55]; // Dark text for dates
              }
              // Right-align numeric content
              else if (/^[\$]?[0-9,]+(\.[0-9]+)?$/.test(content.trim())) {
                data.cell.styles.halign = 'right';
                data.cell.styles.fontStyle = 'normal';
              }
              
              // Style currency values
              if (content.includes('$')) {
                data.cell.styles.textColor = [22, 101, 52]; // Green for money
              }
            }
            
            // Style headers appropriately
            if (data.section === 'head') {
              const content = data.cell.raw?.toString() || '';
              if (content.toLowerCase().includes('date')) {
                data.cell.styles.halign = 'center';
              }
            }
          }
        });
        
        // Update position after the table
        contentY = (doc as any).lastAutoTable.finalY + 12;
      }
      
      // Update yPos to the position after all content
      yPos = Math.max(contentY, yPos + 20);
      
      // Charts are now added immediately after questions, not here
      
      // Add cache indicator if message was from cache
      if (answer.fromCache) {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('(from cache)', 25, yPos + 5);
        yPos += 10;
      }
      
      // Add timestamp if enabled
      if (config.includeTimestamp && answer.timestamp) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const timeStr = answer.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Generated: ${timeStr}`, 25, yPos + 5);
        yPos += 10;
      }
    }
  }
  
  // Visualizations are now handled inline with their corresponding questions
  // This improves readability by showing charts immediately after the analysis that generated them
  
  // Add professional summary section
  const hasCharts = visualizations && visualizations.length > 0 && config.includeCharts;
  const hasMultipleMessages = questionAnswerPairs.length > 1;
  
  if (hasCharts || hasMultipleMessages) {
    doc.addPage();
    
    // Add professional header
    doc.setFillColor(78, 113, 255);
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('Report Summary', 20, 16);
    
    let summaryY = 40;
    
    // Add report statistics
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('Report Statistics', 20, summaryY);
    
    summaryY += 10;
    
    // Statistics box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, summaryY, 170, 40, 2, 2, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    
    let statY = summaryY + 8;
    doc.text(`• Verified Question-Answer Pairs: ${questionAnswerPairs.length}`, 25, statY);
    statY += 6;
    
    // Calculate total questions vs validated pairs
    const totalQuestions = filteredMessages.filter(m => m.sender === 'user').length;
    const validationRate = totalQuestions > 0 ? Math.round((questionAnswerPairs.length / totalQuestions) * 100) : 0;
    doc.text(`• Answer Validation Rate: ${validationRate}% (${questionAnswerPairs.length}/${totalQuestions})`, 25, statY);
    statY += 6;
    
    if (hasCharts) {
      doc.text(`• Data Visualizations: ${visualizations!.length} (inline with analysis)`, 25, statY);
      statY += 6;
    }
    
    // Count tables in answer messages
    const tableCount = questionAnswerPairs.reduce((count, pair) => {
      if (pair.answer) {
        const tableMatches = pair.answer.text.match(/\|[\s\S]*?\|/g);
        return count + (tableMatches ? tableMatches.length : 0);
      }
      return count;
    }, 0);
    
    if (tableCount > 0) {
      doc.text(`• Data Tables: ${tableCount}`, 25, statY);
      statY += 6;
    }
    
    if (fileName) {
      doc.text(`• Source File: ${fileName}`, 25, statY);
      statY += 6;
    }
    
    // Add more spacing
    summaryY += 50;
    
    // Report Information Section
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('Report Information', 20, summaryY);
    
    // Report info box
    summaryY += 10;
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(20, summaryY, 170, 25, 2, 2, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Generated by Finaxial AI Financial Assistant', 25, summaryY + 8);
    doc.text(`Export Date: ${new Date().toLocaleDateString()} | ${new Date().toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    })}`, 25, summaryY + 15);
    doc.text(`Export Time: ${new Date().toLocaleTimeString()}`, 25, summaryY + 22);
    
    doc.addPage();
  }
  
  doc.save(config.filename);
};

/**
 * Helper function to extract code blocks and tables from text with enhanced formatting
 */
function extractFormattedContent(text: string) {
  const processedText = [];
  const codeBlocks = [];
  const tables = [];
  
  try {
    // First, split the text by code blocks
    const codeBlockRegex = /```(sql|json|javascript|python|code)?\n?([\s\S]*?)```/gi;
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before this code block
      processedText.push(text.substring(lastIndex, match.index));
      
      // Add a placeholder for the code block
      processedText.push(`\n[Code Block ${codeBlocks.length + 1}]\n`);
      
      // Store the code block
      codeBlocks.push({
        language: match[1] || 'code',
        content: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    processedText.push(text.substring(lastIndex));
    
    // Now look for table structures in the processed text
    let joinedText = processedText.join('');
    
    // Enhanced table regex to capture various table formats
    const tableRegex = /(\|[^\n]*\|\n\|[-:\s|]*\|\n(?:\|[^\n]*\|\n?)*)/g;
    lastIndex = 0;
    
    const finalProcessedText = [];
    while ((match = tableRegex.exec(joinedText)) !== null) {
      // Add text before this table
      finalProcessedText.push(joinedText.substring(lastIndex, match.index));
      
      // Add a placeholder for the table
      finalProcessedText.push(`\n[Table ${tables.length + 1}]\n`);
      
      // Process the table
      const tableText = match[0].trim();
      const tableLines = tableText.split('\n').filter(line => line.trim());
      
      if (tableLines.length >= 3) {
        // Extract headers
        const headers = tableLines[0].split('|')
          .filter(cell => cell.trim().length > 0)
          .map(h => h.trim().replace(/\*\*/g, '')); // Remove markdown bold
        
        // Skip the separator line and process data rows
        const rows = [];
        for (let i = 2; i < tableLines.length; i++) {
          if (!tableLines[i] || !tableLines[i].includes('|')) continue;
          
          const rowCells = tableLines[i].split('|')
            .filter(cell => cell.trim().length > 0)
            .map(cell => {
              // Clean the cell but preserve dates and special formatting
              const cleanedCell = cell.trim().replace(/\*\*/g, '');
              return cleanedCell; // Don't format here, format in the table rendering
            });
          
          if (rowCells.length > 0 && rowCells.length === headers.length) {
            rows.push(rowCells);
          }
        }
        
        // Only add table if it has valid structure
        if (headers.length > 0 && rows.length > 0) {
          tables.push({ headers, rows });
        }
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    finalProcessedText.push(joinedText.substring(lastIndex));
    
    // Process the final text for better formatting
    let finalText = finalProcessedText.join('');
    
    // Enhanced text processing for better PDF formatting
    finalText = finalText
      // Convert markdown headers to formatted text
      .replace(/#{1,6}\s+([^\n]+)/g, '\n$1:\n')
      // Convert bullet points to proper symbols
      .replace(/^\s*[-*•]\s+(.+)$/gm, '• $1')
      // Convert numbered lists
      .replace(/^\s*(\d+)[.)]\s+(.+)$/gm, '$1. $2')
      // Handle bold text (remove markdown, keep text)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      // Handle italic text
      .replace(/\*(.+?)\*/g, '$1')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      // Remove extra spaces
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    return {
      processedText: finalText,
      codeBlocks,
      tables
    };
  } catch (error) {
    console.error('Error extracting formatted content:', error);
    return {
      processedText: text.replace(/\*\*/g, '').replace(/\*/g, ''),
      codeBlocks: [],
      tables: []
    };
  }
}

/**
 * Format table cell content with enhanced formatting
 */
function formatTableCell(cellContent: string): string {
  if (!cellContent || cellContent.trim() === '') return '';
  
  // Clean the content first
  let cleaned = cellContent.trim();
  
  // Handle date formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.)
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ];
  
  // Check if content matches any date format
  if (datePatterns.some(pattern => pattern.test(cleaned))) {
    return cleaned; // Return date as-is without further processing
  }
  
  // Handle percentage values
  if (cleaned.includes('%')) {
    const percentMatch = cleaned.match(/([0-9.,]+)%/);
    if (percentMatch) {
      return `${percentMatch[1]}%`;
    }
  }
  
  // Handle currency values
  const currencyMatch = cleaned.match(/^\$?\s*([0-9,]+(?:\.[0-9]+)?)/);
  if (currencyMatch) {
    const amount = currencyMatch[1];
    return cleaned.startsWith('$') ? `$${amount}` : amount;
  }
  
  // Handle large numbers with K, M, B suffixes
  const suffixMatch = cleaned.match(/([0-9.,]+)\s*([KMB])/i);
  if (suffixMatch) {
    return `${suffixMatch[1]}${suffixMatch[2].toUpperCase()}`;
  }
  
  // Handle regular numbers with commas
  const numberMatch = cleaned.match(/^([0-9,]+(?:\.[0-9]+)?)$/);
  if (numberMatch) {
    return numberMatch[1];
  }
  
  // Handle negative numbers in parentheses (accounting format)
  const negativeMatch = cleaned.match(/^\(([0-9.,]+)\)$/);
  if (negativeMatch) {
    return `(${negativeMatch[1]})`;
  }
  
  // Clean up any remaining formatting
  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,()$%-]/g, '')
    .trim();
}

/**
 * Helper function to calculate the height a table will take in the PDF
 */
function calculateTableHeight(table: { headers: string[], rows: string[][] }, doc: jsPDF): number {
  // Calculate more accurate height based on content
  const rowCount = table.rows.length;
  const baseHeight = 12; // Height for the table header
  const rowHeight = 8; // Increased height per row for better readability
  
  // Add extra height for complex tables
  const extraHeight = table.headers.length > 4 ? 10 : 0;
  
  return baseHeight + (rowCount * rowHeight) + extraHeight;
}

/**
 * Generates PDF with just the messages (without visualizations)
 * Helper function for simpler use cases
 */
export const generateSimpleChatPDF = (messages: Message[], fileName?: string): void => {
  generateChatPDF(messages, undefined, fileName, {
    includeCharts: false,
  });
}; 