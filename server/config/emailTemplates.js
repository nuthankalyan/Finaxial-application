const welcomeEmailTemplate = (username, signupTime) => `
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

module.exports = {
    welcomeEmailTemplate,
    resetPasswordTemplate
};
