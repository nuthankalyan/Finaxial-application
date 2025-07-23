'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Message } from '../components/FinancialAssistant';

interface PDFGenerationOptions {
  title?: string;
  filename?: string;
  includeTimestamp?: boolean;
  includeCharts?: boolean;
}

/**
 * Generates a PDF from Financial Assistant chat history
 */
export const generateChatPDF = async (
  messages: Message[],
  visualizations?: HTMLCanvasElement[], 
  fileName?: string,
  options?: PDFGenerationOptions
): Promise<void> => {
  // Initialize PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const defaultOptions: PDFGenerationOptions = {
    title: 'Financial Analysis Conversation',
    filename: fileName ? `${fileName}-chat.pdf` : 'financial-assistant-chat.pdf',
    includeTimestamp: true,
    includeCharts: false, // Default to not include charts
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80);
  doc.text(config.title!, 15, 15);
  
  // Add date if requested
  if (config.includeTimestamp) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const today = new Date().toLocaleString();
    doc.text(`Generated: ${today}`, 15, 22);
  }
  
  // Add file information if available
  if (fileName) {
    doc.setFontSize(11);
    doc.setTextColor(70, 70, 70);
    doc.text(`Data source: ${fileName}`, 15, 28);
  }
  
  let yPos = 35;
  
  // Add a divider line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(15, yPos, 195, yPos);
  yPos += 5;
  
  // Filter out typing indicators and only include actual messages
  const filteredMessages = messages.filter(m => m.text !== '...');
  
  // Process all messages in sequence (not just pairs)
  for (let i = 0; i < filteredMessages.length; i++) {
    const message = filteredMessages[i];
    
    // Add spacing between messages
    if (i > 0) {
      yPos += 5;
    }
    
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 15;
    }
    
    if (message.sender === 'user') {
      // Add user message - similar to user bubble in UI
      doc.setFillColor(99, 102, 241); // Indigo color like in UI
      doc.setDrawColor(99, 102, 241);
      
      // Make a chat bubble for user messages
      const userMessage = message.text;
      const textLines = doc.splitTextToSize(userMessage, 160);
      const bubbleHeight = Math.max(10, textLines.length * 5.5);
      
      // Draw rounded rectangle for user message (positioned on right)
      doc.roundedRect(40, yPos, 155, bubbleHeight, 3, 3, 'F');
      
      // Add text inside bubble
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(textLines, 45, yPos + 6);
      
      yPos += bubbleHeight + 5;
    } else {
      // Process the message content to extract code blocks and tables
      const { processedText, codeBlocks, tables } = extractFormattedContent(message.text);
      
      // Assistant message - styled like the assistant bubble in UI
      doc.setFillColor(243, 244, 246); // Light gray background
      doc.setDrawColor(243, 244, 246);
      
      // Split text to respect the page width
      const textLines = doc.splitTextToSize(processedText, 160);
      const textHeight = textLines.length * 5.5;
      
      // Calculate total height including code blocks and tables
      let totalHeight = textHeight;
      let codeBlocksHeight = 0;
      codeBlocks.forEach(code => {
        const codeLines = doc.splitTextToSize(code.content, 150);
        codeBlocksHeight += 8 + codeLines.length * 5; // Header + content
      });
      
      let tablesHeight = 0;
      tables.forEach(table => {
        tablesHeight += calculateTableHeight(table, doc);
      });
      
      const totalContentHeight = textHeight + codeBlocksHeight + tablesHeight;
      const bubbleHeight = Math.max(10, totalContentHeight);
      
      // Check if the content will overflow and add a new page if needed
      if (yPos + bubbleHeight > 270) {
        doc.addPage();
        yPos = 15;
      }
      
      // Draw rounded rectangle for assistant message (positioned on left)
      doc.roundedRect(15, yPos, 170, bubbleHeight + 5, 3, 3, 'F');
      
      // Add text inside bubble
      doc.setTextColor(55, 65, 81); // Similar to the dark gray in UI
      doc.setFontSize(10);
      
      // Add the main text content
      doc.text(textLines, 20, yPos + 6);
      let contentY = yPos + textHeight + 8;
      
      // Add code blocks with styled boxes
      for (const codeBlock of codeBlocks) {
        // Check if we need a new page for the code block
        if (contentY > 270) {
          doc.addPage();
          contentY = 15;
        }
        
        // Draw code block header
        doc.setFillColor(30, 41, 59); // Dark blue for code block header
        doc.setDrawColor(30, 41, 59);
        doc.roundedRect(25, contentY, 150, 6, 1, 1, 'F');
        
        // Add language label
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`${codeBlock.language}`, 30, contentY + 4);
        
        // Draw code block body
        doc.setFillColor(15, 23, 42); // Darker blue for code block body
        doc.setDrawColor(15, 23, 42);
        
        const codeLines = doc.splitTextToSize(codeBlock.content, 145);
        const codeHeight = codeLines.length * 5 + 2;
        doc.roundedRect(25, contentY + 6, 150, codeHeight, 1, 1, 'F');
        
        // Add code content
        doc.setTextColor(226, 232, 240); // Light gray for code text
        doc.setFontSize(8);
        doc.setFont('Courier', 'normal');
        doc.text(codeLines, 30, contentY + 10);
        doc.setFont('Helvetica', 'normal');
        
        contentY += codeHeight + 8;
      }
      
      // Add tables
      for (const table of tables) {
        // Check if we need a new page for the table
        if (contentY > 250) {
          doc.addPage();
          contentY = 15;
        }
        
        // Draw table header
        doc.setFillColor(240, 249, 255); // Light blue for table header
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(25, contentY, 150, 6, 1, 1, 'F');
        
        // Add table label
        doc.setTextColor(14, 116, 144);
        doc.setFontSize(8);
        doc.text("Financial Data Table", 30, contentY + 4);
        
        contentY += 8;
        
        // Prepare table data with proper formatting
        const formattedHeaders = table.headers.map(h => h.trim());
        const formattedRows = table.rows.map(row => 
          row.map(cell => cell.toString())
        );
        
        // Calculate column widths based on content
        const columnWidths: Record<string, number> = {};
        let totalWidth = 0;
        
        // Function to get approximate text width
        const getTextWidth = (text: string, fontSize = 8) => {
          return text.length * (fontSize * 0.5);
        };
        
        // Determine widths based on content
        formattedHeaders.forEach((header, idx) => {
          let maxWidth = getTextWidth(header);
          
          // Check widths in rows for this column
          formattedRows.forEach(row => {
            if (row[idx]) {
              const cellWidth = getTextWidth(row[idx]);
              maxWidth = Math.max(maxWidth, cellWidth);
            }
          });
          
          // Set column width with some padding
          columnWidths[idx.toString()] = maxWidth + 10;
          totalWidth += columnWidths[idx.toString()];
        });
        
        // Scale widths if total is too large
        if (totalWidth > 150) {
          const scale = 150 / totalWidth;
          Object.keys(columnWidths).forEach(idx => {
            columnWidths[idx] *= scale;
          });
        }
        
        // Use autoTable with improved options
        autoTable(doc, {
          startY: contentY,
          head: [formattedHeaders],
          body: formattedRows,
          margin: { left: 25 },
          tableWidth: 150,
          styles: { 
            fontSize: 8,
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
          },
          headStyles: {
            fillColor: [224, 242, 254],
            textColor: [3, 105, 161],
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: Object.keys(columnWidths).reduce<Record<string, any>>((styles, idx) => {
            // Check if the column appears to contain numbers
            const isNumericColumn = formattedRows.length > 0 &&
              formattedRows.every(row => 
                !row[parseInt(idx)] || /^[\$]?[0-9,.]+$/.test(row[parseInt(idx)].trim())
              );
            
            styles[idx] = {
              cellWidth: columnWidths[idx],
              halign: isNumericColumn ? 'right' : 'left'
            };
            return styles;
          }, {}),
          didParseCell: (data) => {
            // Special handling for headers
            if (data.section === 'head') {
              data.cell.styles.fillColor = [224, 242, 254];
              data.cell.styles.textColor = [3, 105, 161];
              data.cell.styles.fontStyle = 'bold';
            }
            
            // Format numeric cells
            if (data.section === 'body') {
              const content = data.cell.raw?.toString() || '';
              if (/^[\$]?[0-9,.]+$/.test(content.trim())) {
                data.cell.styles.halign = 'right';
              }
            }
          },
          didDrawPage: () => {
            // This function is called when a new page is drawn
          }
        });
        
        // Update position after the table
        contentY = (doc as any).lastAutoTable.finalY + 10; // Add more spacing after tables
      }
      
      // Add "cached" indicator if the message was from cache
      if (message.fromCache) {
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('Cached', 175, yPos + bubbleHeight - 2);
      }
      
      yPos = contentY + 2;
      
      // Add timestamp if requested
      if (config.includeTimestamp && message.timestamp) {
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          175,
          yPos - 2
        );
        yPos += 3;
      }
    }
  }
  
  // Add visualizations only if explicitly requested and available
  if (visualizations && visualizations.length > 0 && config.includeCharts) {
    // Add a page break for visualizations
    doc.addPage();
    
    // Add visualizations header
    doc.setFontSize(16);
    doc.setTextColor(78, 113, 255); // Brand color
    doc.text('Data Visualizations', 15, 15);
    
    // Add subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${visualizations.length} chart(s) generated during analysis`, 15, 22);
    
    // Add divider
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(15, 25, 195, 25);
    
    let vizY = 35;
    
    // Add each visualization with proper spacing and labels
    for (let i = 0; i < visualizations.length; i++) {
      const canvas = visualizations[i];
      
      // Ensure the canvas exists
      if (!canvas) continue;
      
      // Add a new page if needed (leaving space for chart + title)
      if (vizY > 180) {
        doc.addPage();
        vizY = 15;
      }
      
      try {
        // Add chart title
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text(`Chart ${i + 1}`, 15, vizY);
        vizY += 10;
        
        // Convert canvas to image data URL with high quality
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions to fit on the page (maintain aspect ratio)
        const canvasAspect = canvas.width / canvas.height;
        const maxWidth = 170;
        const maxHeight = 120;
        
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / canvasAspect;
        
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * canvasAspect;
        }
        
        // Center the image horizontally
        const imgX = (210 - imgWidth) / 2;
        
        // Add border around chart
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(imgX - 2, vizY - 2, imgWidth + 4, imgHeight + 4);
        
        // Add image to PDF
        doc.addImage(imgData, 'PNG', imgX, vizY, imgWidth, imgHeight);
        
        // Update Y position for the next chart
        vizY += imgHeight + 20;
        
        // Add spacing between charts
        if (i < visualizations.length - 1) {
          vizY += 5;
        }
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
        // Add error message instead of chart
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38);
        doc.text(`Error loading Chart ${i + 1}`, 15, vizY);
        vizY += 15;
      }
    }
  }
  
  // Add summary section
  const hasCharts = visualizations && visualizations.length > 0 && config.includeCharts;
  const hasMultipleMessages = filteredMessages.length > 2;
  
  if (hasCharts || hasMultipleMessages) {
    doc.addPage();
    
    // Add summary header
    doc.setFontSize(16);
    doc.setTextColor(78, 113, 255);
    doc.text('Analysis Summary', 15, 15);
    
    // Add divider
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(15, 20, 195, 20);
    
    let summaryY = 30;
    
    // Add statistics
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text(`• Total messages: ${filteredMessages.length}`, 15, summaryY);
    summaryY += 7;
    
    if (hasCharts) {
      doc.text(`• Visualizations: ${visualizations!.length}`, 15, summaryY);
      summaryY += 7;
    }
    
    // Count tables in messages
    const tableCount = filteredMessages.reduce((count, msg) => {
      const tableMatches = msg.text.match(/\|[\s\S]*?\|/g);
      return count + (tableMatches ? tableMatches.length : 0);
    }, 0);
    
    if (tableCount > 0) {
      doc.text(`• Data tables: ${tableCount}`, 15, summaryY);
      summaryY += 7;
    }
    
    if (fileName) {
      doc.text(`• Source file: ${fileName}`, 15, summaryY);
      summaryY += 7;
    }
    
    summaryY += 5;
    
    // Add generation info
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by Finaxial Financial Assistant', 15, summaryY);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 15, summaryY + 5);
  }
  
  // Save the PDF
  doc.save(config.filename);
};

/**
 * Helper function to extract code blocks and tables from text
 */
function extractFormattedContent(text: string) {
  const processedText = [];
  const codeBlocks = [];
  const tables = [];
  
  try {
    // Split the text by code blocks
    const codeBlockRegex = /```(sql|json)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before this code block
      processedText.push(text.substring(lastIndex, match.index));
      
      // Add a placeholder for the code block
      processedText.push(`[Code Block ${codeBlocks.length + 1}]`);
      
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
    
    // Improved table regex to better detect financial tables, including multiple formats
    // This handles more complex tables with aligned columns
    const tableRegex = /(\|[^\n]*\|\n\|[-:\s|]*\|\n(?:\|[^\n]*\|\n)+)/g;
    lastIndex = 0;
    
    const finalProcessedText = [];
    while ((match = tableRegex.exec(joinedText)) !== null) {
      // Add text before this table
      finalProcessedText.push(joinedText.substring(lastIndex, match.index));
      
      // Add a placeholder for the table
      finalProcessedText.push(`[Table ${tables.length + 1}]`);
      
      // Process the table
      const tableText = match[0].trim();
      const tableLines = tableText.split('\n');
      
      // Extract headers, make sure to properly handle multiline headers
      const headers = tableLines[0].split('|')
        .filter(cell => cell.trim().length > 0)
        .map(h => h.trim());
      
      // Skip the separator line
      const rows = [];
      for (let i = 2; i < tableLines.length; i++) {
        if (!tableLines[i] || !tableLines[i].includes('|')) continue;
        
        const rowCells = tableLines[i].split('|')
          .filter(cell => cell.trim().length > 0)
          .map(cell => formatTableCell(cell.trim()));
        
        if (rowCells.length > 0) {
          rows.push(rowCells);
        }
      }
      
      // Store the table
      tables.push({
        headers,
        rows
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    finalProcessedText.push(joinedText.substring(lastIndex));
    
    // Process other elements like headers and bullet points
    let finalText = finalProcessedText.join('');
    
    // Replace markdown headers with text and make them bold
    finalText = finalText.replace(/#{1,6}\s+([^\n]+)/g, '$1:');
    
    // Replace bullet points
    finalText = finalText.replace(/- ([^\n]+)/g, '• $1');
    
    // Replace multiple newlines with single ones
    finalText = finalText.replace(/\n{3,}/g, '\n\n');
    
    return {
      processedText: finalText,
      codeBlocks,
      tables
    };
  } catch (error) {
    console.error('Error extracting formatted content:', error);
    return {
      processedText: text,
      codeBlocks: [],
      tables: []
    };
  }
}

/**
 * Format table cell content, handling number formats correctly
 */
function formatTableCell(cellContent: string): string {
  // Check if cell content is a number with comma as thousands separator
  const numberWithCommas = /^([0-9,]+(\.[0-9]+)?)$/;
  if (numberWithCommas.test(cellContent)) {
    // Keep the number format as is
    return cellContent;
  }
  
  // Special handling for dollar amounts
  const moneyFormat = /^\$?([0-9,]+(\.[0-9]+)?)$/;
  if (moneyFormat.test(cellContent)) {
    return cellContent;
  }
  
  return cellContent;
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