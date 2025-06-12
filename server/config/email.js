const nodemailer = require('nodemailer');
const { welcomeEmailTemplate, resetPasswordTemplate } = require('./emailTemplates');

// Create a transporter with SMTP configuration
const createTransporter = () => {
  const user = process.env.EMAIL_USER || 'finaxialai@gmail.com';
  const pass = process.env.EMAIL_PASS || 'nwolasmoqpwsxllt';
  
  if (!user || !pass) {
    throw new Error('Email credentials missing. Check your .env file.');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
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

// Function to send welcome email
const sendWelcomeEmail = async (userEmail, username) => {
  try {
    // Validate inputs
    if (!userEmail || !username) {
      throw new Error('Email address and username are required');
    }

    const transporter = createTransporter();
    
    // Format the current date and time
    const signupTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZoneName: 'short'
    });
    
    const mailOptions = {
      from: {
        name: 'FinAxial AI',
        address: process.env.EMAIL_USER || 'finaxialai@gmail.com'
      },
      to: userEmail,
      subject: 'Welcome to FinAxial AI',
      html: welcomeEmailTemplate(username, signupTime)
    };

    console.log('Sending welcome email to:', userEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully. Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Function to send password reset OTP email
const sendPasswordResetEmail = async (userEmail, username, otp) => {
  try {
    // Validate inputs
    if (!userEmail || !username || !otp) {
      throw new Error('Email address, username and OTP are required');
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'FinAxial AI',
        address: process.env.EMAIL_USER || 'finaxialai@gmail.com'
      },
      to: userEmail,
      subject: 'Password Reset - FinAxial AI',
      html: resetPasswordTemplate(username, otp)
    };

    console.log('Sending password reset email to:', userEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully. Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendEmailWithPdf,
  sendWelcomeEmail,
  sendPasswordResetEmail
};