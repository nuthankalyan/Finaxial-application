// Service to handle sending PDF reports via email through the server API

// Add import for API config
import { buildApiUrl } from '../utils/apiConfig';

/**
 * Send a PDF report via email using the server's Nodemailer implementation
 * @param recipientEmail Email address of the recipient
 * @param pdfData PDF data as a base64 string (without data URI prefix)
 * @param fileName Name of the file to be attached
 * @param subject Email subject
 * @param message Email message body
 * @returns Promise with the result of the email operation
 */
export const sendPdfReportByEmail = async (
  recipientEmail: string,
  pdfData: string,
  fileName: string,
  subject?: string,
  message?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    // Validate that the PDF data is present
    if (!pdfData) {
      throw new Error('PDF data is missing or invalid');
    }
    
    // Log the size of the PDF for debugging
    console.log(`Sending PDF data of size: ${pdfData.length} characters`);
    
    const response = await fetch(buildApiUrl('api/email/send-pdf-report'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipientEmail,
        pdfData, // Pure base64 data without the URI prefix
        fileName,
        subject: subject || `Financial Insights Report - ${fileName}`,
        message: message || `Please find attached the financial insights report for ${fileName}.`
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }
    
    return {
      success: true,
      message: data.message || 'Email sent successfully'
    };
  } catch (error: any) {
    console.error('Error sending email via API:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while sending the email'
    };
  }
}; 