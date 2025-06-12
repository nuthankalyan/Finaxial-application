const nodemailer = require('nodemailer');

// Create a transporter with SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'finaxialai@gmail.com',
      pass: 'nwolasmoqpwsxllt'
    }
  });
};

// Function to format date in a readable style
const formatDate = (date) => {
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Function to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOTPEmail = async (userEmail, otp) => {
  try {
    const transporter = createTransporter();
    const currentTime = new Date();
    const formattedTime = formatDate(currentTime);

    const mailOptions = {
      from: 'finaxialai@gmail.com',
      to: userEmail,
      subject: 'Password Reset OTP - FinAxial AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>You have requested to reset your password for your FinAxial AI account.</p>
          <p>Your OTP is: <strong style="font-size: 24px; color: #2c3e50;">${otp}</strong></p>
          <p>This OTP is valid for 5 minutes and can only be used once.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The FinAxial AI Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP email'
    };
  }
};

// Function to send welcome email
const sendWelcomeEmail = async (userEmail, username) => {
  try {
    const transporter = createTransporter();
    const currentTime = new Date();
    const formattedTime = formatDate(currentTime);

    const mailOptions = {
      from: 'finaxialai@gmail.com',
      to: userEmail,
      subject: 'Welcome to FinAxial AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to FinAxial AI!</h2>
          <p>Dear ${username},</p>
          <p>Welcome aboard! We're thrilled to have you join the FinAxial AI platform on ${formattedTime}.</p>
          <p>Our platform offers powerful financial analysis tools and AI-driven insights to help you make informed decisions. Here are some features you might want to explore:</p>
          <ul>
            <li>Financial data analysis and visualization</li>
            <li>AI-powered financial insights</li>
            <li>Custom reports and analytics</li>
            <li>Collaborative workspaces</li>
          </ul>
          <p>We're here to help you make the most of your financial data. Feel free to explore the platform and reach out if you need any assistance.</p>
          <p>Best regards,<br>The FinAxial AI Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email'
    };
  }
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
  sendEmailWithPdf,
  sendWelcomeEmail,
  sendOTPEmail,
  generateOTP
};