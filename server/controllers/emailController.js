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
      fileData,
      pdfData, // Keep backward compatibility
      fileName, 
      contentType,
      exportFormat,
      workspaceName, 
      customMessage 
    } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient email is required' 
      });
    }
    
    // Use fileData if available, otherwise fall back to pdfData for backward compatibility
    const dataToProcess = fileData || pdfData;
    if (!dataToProcess) {
      return res.status(400).json({ 
        success: false, 
        error: 'File data is required' 
      });
    }
    
    console.log(`Received professional report email request for: ${recipientEmail}`);
    console.log(`File data size: ${dataToProcess.length} characters`);
    console.log(`Export format: ${exportFormat || 'pdf'}`);
    
    try {
      // Convert base64 data to buffer for nodemailer
      const fileBuffer = Buffer.from(dataToProcess, 'base64');
      
      // Validate that the conversion worked
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Failed to convert file data to buffer');
      }
      
      console.log(`Converted to buffer. Buffer size: ${fileBuffer.length} bytes`);
      
      // Determine the actual content type based on format
      let actualContentType = contentType;
      if (!actualContentType) {
        switch (exportFormat) {
          case 'word':
            actualContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'xml':
            actualContentType = 'application/xml';
            break;
          default:
            actualContentType = 'application/pdf';
        }
      }
      
      const result = await sendReportEmail(
        recipientEmail,
        recipientName,
        fileBuffer,
        fileName,
        workspaceName,
        customMessage,
        actualContentType,
        exportFormat
      );
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: `Professional report email sent successfully as ${(exportFormat || 'PDF').toUpperCase()}`,
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send professional report email'
        });
      }
    } catch (conversionError) {
      console.error('Error converting file data:', conversionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process file data: ' + conversionError.message
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