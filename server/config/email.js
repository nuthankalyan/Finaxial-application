const nodemailer = require('nodemailer');

// Create a transporter with SMTP configuration
// Note: For production use, you should store these credentials in environment variables
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!user || !pass) {
    console.warn('Email credentials missing. Check your .env file.');
  }
  
  return nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'outlook', 'yahoo', etc.
    auth: {
      user: user || 'your-email@gmail.com',
      pass: pass || 'your-app-password'
    }
  });
};

// Function to send email with PDF report
const sendEmailWithPdf = async (recipientEmail, pdfBuffer, fileName, subject, message) => {
  try {
    // Validate the PDF buffer
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }
    
    const transporter = createTransporter();
    
    // Generate a unique attachment ID to avoid caching issues
    const attachmentId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: recipientEmail,
      subject: subject || 'Financial Insights Report',
      text: message || 'Please find attached the financial insights report.',
      attachments: [
        {
          filename: fileName || `financial-report-${attachmentId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
          contentDisposition: 'attachment'
        }
      ]
    };
    
    // Log some information for debugging
    console.log(`Sending email to ${recipientEmail} with attachment: ${fileName}`);
    console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email'
    };
  }
};

module.exports = {
  sendEmailWithPdf
}; 