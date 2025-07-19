const { sendEmailWithPdf, sendReportEmail } = require('../config/email');

// Controller function to handle PDF email sending
exports.sendPdfReport = async (req, res) => {
  try {
    const { recipientEmail, pdfData, fileName, subject, message } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient email is required' 
      });
    }
    
    if (!pdfData) {
      return res.status(400).json({ 
        success: false, 
        error: 'PDF data is required' 
      });
    }
    
    console.log(`Received PDF data for email. Size: ${pdfData.length} characters`);
    
    try {
      // Convert base64 data to buffer for nodemailer
      const pdfBuffer = Buffer.from(pdfData, 'base64');
      
      // Validate that the conversion worked
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Failed to convert PDF data to buffer');
      }
      
      console.log(`Converted to buffer. Buffer size: ${pdfBuffer.length} bytes`);
      
      const result = await sendEmailWithPdf(
        recipientEmail,
        pdfBuffer,
        fileName || 'financial-report.pdf',
        subject || 'Financial Insights Report',
        message || 'Please find attached your financial insights report.'
      );
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Email sent successfully',
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email'
        });
      }
    } catch (conversionError) {
      console.error('Error converting PDF data:', conversionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process PDF data: ' + conversionError.message
      });
    }
  } catch (error) {
    console.error('Error in sendPdfReport controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while sending the email'
    });
  }
};

// Controller function to send professional report emails
exports.sendProfessionalReport = async (req, res) => {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      pdfData, 
      fileName, 
      workspaceName, 
      customMessage 
    } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient email is required' 
      });
    }
    
    if (!pdfData) {
      return res.status(400).json({ 
        success: false, 
        error: 'PDF data is required' 
      });
    }
    
    console.log(`Received professional report email request for: ${recipientEmail}`);
    console.log(`PDF data size: ${pdfData.length} characters`);
    
    try {
      // Convert base64 data to buffer for nodemailer
      const pdfBuffer = Buffer.from(pdfData, 'base64');
      
      // Validate that the conversion worked
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Failed to convert PDF data to buffer');
      }
      
      console.log(`Converted to buffer. Buffer size: ${pdfBuffer.length} bytes`);
      
      const result = await sendReportEmail(
        recipientEmail,
        recipientName,
        pdfBuffer,
        fileName,
        workspaceName,
        customMessage
      );
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Professional report email sent successfully',
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send professional report email'
        });
      }
    } catch (conversionError) {
      console.error('Error converting PDF data:', conversionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process PDF data: ' + conversionError.message
      });
    }
  } catch (error) {
    console.error('Error in sendProfessionalReport controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while sending the professional report email'
    });
  }
}; 