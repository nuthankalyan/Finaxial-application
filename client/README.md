# Finaxial App - Client

This is the client side of the Finaxial App, a financial insights tool that helps users analyze financial data and generate insights using AI.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local` in the client directory and fill in your API keys:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Local Development

This repository has been cleaned of deployment-specific configuration files. To run the application locally:

1. Make sure you have Node.js 18 or higher installed
2. Follow the "Getting Started" section above
3. For backend API integration, run the server component separately (see the server README)

If you need to prepare the app for deployment again, refer to the deployment documentation.

## Setting up EmailJS for PDF Email Functionality

To enable the "Send via Email" functionality for sending financial reports via email:

1. Sign up for an account at [EmailJS](https://www.emailjs.com/)

2. Create a new service in EmailJS:
   - Go to "Email Services" tab
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the authentication steps

3. Create an email template:
   - Go to "Email Templates" tab
   - Click "Create New Template"
   - Design your template with the following variables:
     - `{{to_email}}`: Recipient's email
     - `{{to_name}}`: Recipient's name
     - `{{from_name}}`: Sender name (Finaxial App)
     - `{{subject}}`: Email subject
     - `{{message}}`: Email body text
     - `{{theme}}`: Current theme (light/dark)
     - Don't forget to include the attachment placeholders

4. Get your API credentials:
   - Go to "Account" → "API Keys"
   - Copy your Public Key
   - Note your Service ID from the "Email Services" tab
   - Note your Template ID from the "Email Templates" tab

5. Update your `.env.local` file with these credentials:
   ```
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
   ```

6. Restart your development server and the email functionality should now work.

## Theme Support

Finaxial supports both light and dark themes:

1. **Automatic Theme Detection**: 
   - The app automatically detects the user's system preference for light or dark mode.
   - This setting is applied on first load.

2. **Manual Theme Switching**:
   - Users can toggle between light and dark modes using the theme toggle button in the header.
   - The selected theme is stored in local storage for persistence.

3. **Theme-Aware Email Templates**:
   - When sending emails, the current theme preference is included.
   - Email templates can use the `{{theme}}` variable to apply appropriate styling.
   - See the example template in `emailjs-template-example.html`.

## Features

- Financial data analysis with AI-powered insights
- Secure authentication
- Dashboard for managing workspaces
- Upload and analyze CSV files
- Generate, view, and save financial insights
- Export insights as PDF
- Email reports directly from the application
- Light/dark theme support

## Technologies Used

- Next.js
- React
- TypeScript
- Framer Motion
- jsPDF (PDF generation)
- EmailJS (Email functionality)
- Google Gemini AI
