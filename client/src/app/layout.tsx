import './globals.css';
// Import fonts CSS
import './fonts.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Script from 'next/script';
import localFont from 'next/font/local';

// Define local fonts
const interFont = localFont({
  src: [
    {
      path: '../../public/fonts/inter/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

const robotoMonoFont = localFont({
  src: '../../public/fonts/roboto-mono/RobotoMono-Regular.woff2',
  variable: '--font-roboto-mono',
  display: 'swap',
  fallback: ['Consolas', 'monospace'],
});

export const metadata = {
  title: 'Finaxial - Financial Analysis and Insights',
  description: 'A powerful financial analysis tool that provides insights and recommendations based on your financial data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* No external font resources needed - using local fonts */}
      </head>
      <body className={`${interFont.variable} ${robotoMonoFont.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        
        {/* 
          Initialize EmailJS globally to ensure it's available throughout the application
          Using Script with dynamic import to ensure it only runs on the client side
          This is necessary because EmailJS requires the window object
        */}
        <Script id="email-js-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              import('@emailjs/browser').then(emailjs => {
                const publicKey = "--O1WwdZnrIVo-Mqk"; // Hardcoded key
                if (publicKey) {
                  emailjs.init(publicKey);
                  console.log("EmailJS initialized with key:", publicKey.substring(0, 5) + "...");
                } else {
                  console.warn("EmailJS public key is not available");
                }
              }).catch(err => console.error('Failed to initialize EmailJS:', err));
            }
          `}
        </Script>
      </body>
    </html>
  );
}
