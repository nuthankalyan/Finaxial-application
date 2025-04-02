import './globals.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono'
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
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        {/* 
          Initialize EmailJS globally to ensure it's available throughout the application
          Using Script with dynamic import to ensure it only runs on the client side
          This is necessary because EmailJS requires the window object
          
          Alternative approach: You could also use a useEffect in specific components where
          email functionality is needed, but this global approach ensures EmailJS is 
          always ready when needed.
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
