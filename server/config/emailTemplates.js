const welcomeEmailTemplate = (username, signupTime) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  <div class="feature">
                    <h4>Executive Summary</h4>
                    <p>High-level overview of key findings</p>
                </div> .container { max-width: 600px; margin: auto; padding: 20px; }
        .header { font-size: 24px; color: #2563eb; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .footer { font-size: 14px; color: #666; margin-top: 30px; }
        .highlight { color: #2563eb; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            Welcome to FinAxial AI!
        </div>
        <div class="content">
            <p>Dear ${username},</p>
            <p>Thank you for signing up with FinAxial AI on ${signupTime}. We're excited to have you join our community of financial professionals and data enthusiasts!</p>
            
            <p>With your new FinAxial AI account, you can:</p>
            <ul>
                <li>Upload and analyze financial data using advanced AI</li>
                <li>Generate comprehensive reports with visual insights</li>
                <li>Get AI-powered recommendations for financial decision-making</li>
                <li>Collaborate with team members in shared workspaces</li>
                <li>Export and share your findings in multiple formats</li>
            </ul>

            <p>To get started:</p>
            <ol>
                <li>Log in to your account</li>
                <li>Create your first workspace</li>
                <li>Upload your financial data</li>
                <li>Let our AI generate insights for you</li>
            </ol>

            <p>If you have any questions or need assistance, our support team is here to help!</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The FinAxial AI Team</p>
            <p style="font-size: 12px; color: #888;">
                This email was sent because you signed up for a FinAxial AI account. 
                If you didn't create this account, please contact our support team.
            </p>
        </div>
    </div>
</body>
</html>
`;

const resetPasswordTemplate = (username, otp) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: auto; padding: 20px; }
        .header { font-size: 24px; color: #2563eb; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .footer { font-size: 14px; color: #666; margin-top: 30px; }
        .highlight { color: #2563eb; }
        .otp-box {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            font-size: 24px;
            text-align: center;
            letter-spacing: 4px;
            margin: 20px 0;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            Password Reset Request - FinAxial AI
        </div>
        <div class="content">
            <p>Dear ${username},</p>
            <p>We received a request to reset your password for your FinAxial AI account. Your one-time password (OTP) is:</p>
            
            <div class="otp-box">
                ${otp}
            </div>

            <p>This OTP will expire in 5 minutes for security reasons. If you did not request this password reset, please ignore this email and ensure your account is secure.</p>
            
            <p>For security reasons:</p>
            <ul>
                <li>Never share this OTP with anyone</li>
                <li>Our team will never ask for this code</li>
                <li>Make sure you're on the official FinAxial AI website</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The FinAxial AI Team</p>
            <p style="font-size: 12px; color: #888;">
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
`;

const reportEmailTemplate = (recipientName, workspaceName, reportDate, customMessage) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 0.5rem 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 2rem; }
        .greeting { font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 1rem; }
        .message { margin: 1rem 0; color: #4a5568; font-size: 16px; }
        .report-info { background-color: #f7fafc; border-left: 4px solid #667eea; padding: 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
        .report-info h3 { margin: 0 0 0.5rem 0; color: #2d3748; font-size: 18px; }
        .report-info p { margin: 0.25rem 0; color: #4a5568; }
        .attachment-info { background-color: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; }
        .attachment-icon { background-color: #38b2ac; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; font-weight: bold; }
        .attachment-text { flex: 1; }
        .attachment-text h4 { margin: 0 0 0.25rem 0; color: #2d3748; }
        .attachment-text p { margin: 0; color: #4a5568; font-size: 14px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 1.5rem 0; text-align: center; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
        .feature { background-color: #f7fafc; padding: 1rem; border-radius: 8px; text-align: center; }
        .feature-icon { font-size: 24px; margin-bottom: 0.5rem; }
        .feature h4 { margin: 0 0 0.5rem 0; color: #2d3748; font-size: 14px; }
        .feature p { margin: 0; color: #4a5568; font-size: 12px; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 1.5rem 2rem; text-align: center; }
        .footer-links { margin: 1rem 0 0 0; }
        .footer-links a { color: #667eea; text-decoration: none; margin: 0 1rem; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 1.5rem 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FinAxial Report</h1>
            <p>Professional Financial Analysis & Insights</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${recipientName || 'there'}!</div>
            
            <div class="message">
                ${customMessage || 'We are pleased to share your comprehensive financial analysis report generated using FinAxial AI. This report contains detailed insights and professional analysis of your financial data.'}
            </div>
            
            <div class="report-info">
                <h3>Report Details</h3>
                <p><strong>Workspace:</strong> ${workspaceName || 'Financial Analysis'}</p>
                <p><strong>Generated:</strong> ${reportDate || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Format:</strong> Professional PDF with comprehensive analysis</p>
                <p><strong>Analysis Type:</strong> AI-powered financial insights and recommendations</p>
            </div>
            
            <div class="attachment-info">
                <div class="attachment-text">
                    <h4>PDF Report Attached</h4>
                    <p>Your complete financial analysis report is attached to this email. Open it to view detailed insights, recommendations, and professional formatting.</p>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #2d3748; margin-bottom: 1rem;"> What's Inside Your Report</h3>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">�</div>
                    <h4>Executive Summary</h4>
                    <p>High-level overview of key findings</p>
                </div>
                <div class="feature">
                    <h4>AI Insights</h4>
                    <p>Machine learning-powered analysis</p>
                </div>
                <div class="feature">
                    <h4>Data Visualizations</h4>
                    <p>Charts and graphs for easy understanding</p>
                </div>
                <div class="feature">
                    <h4>Recommendations</h4>
                    <p>Actionable strategies for improvement</p>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #4a5568; font-size: 14px; text-align: center; margin: 1.5rem 0;">
                <strong>Need help interpreting your report?</strong><br>
                Contact our support team or visit our help center for detailed guidance on understanding your financial analysis.
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 0.5rem 0; font-weight: 600;">Best regards,<br>The FinAxial AI Team</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                This email contains your confidential financial analysis. Please handle with care and store securely.
            </p>
            <div class="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Support</a>
            </div>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    welcomeEmailTemplate,
    resetPasswordTemplate,
    reportEmailTemplate
};
