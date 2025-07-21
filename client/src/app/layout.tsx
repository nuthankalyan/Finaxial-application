import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://finaxial.tech'),
  title: 'Finaxial - AI-Powered Financial Analysis & Reporting Platform',
  description: 'Streamline financial workflows with Finaxial AI analytics, anomaly detection, tax optimization, and automated compliance checks. Transform financial data into strategic insights.',
  keywords: 'financial analysis, anomaly detection, financial compliance, tax optimization, financial reporting, AI finance, automated reports, financial insights, data transformation, financial dashboard',
  openGraph: {
    title: 'Finaxial - Transform Financial Data into Strategic Insights',
    description: 'AI-powered financial analytics with anomaly detection, compliance checks, and tax optimization to maximize financial performance.',
    url: 'https://finaxial.tech',
    siteName: 'Finaxial',
    images: [
      {
        url: 'https://finaxial.tech/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Finaxial Platform Screenshot',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finaxial - AI-Powered Financial Analytics',
    description: 'Transform your financial workflows with AI-powered insights, anomaly detection and compliance automation.',
    images: ['https://finaxial.tech/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification_token',
    yandex: 'verification_token',
    yahoo: 'verification_token',
  },
  alternates: {
    canonical: 'https://finaxial.tech',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* No external font resources needed - using system fonts */}
      </head>
      <body className="font-sans">
        {/* Structured data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Finaxial",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "AI-powered financial analytics with anomaly detection, compliance checks, and tax optimization",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "145"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Finaxial",
              "url": "https://finaxial.tech",
              "logo": "https://finaxial.tech/finaxial-logooo.png",
              "sameAs": [
                "https://twitter.com/finaxial",
                "https://www.linkedin.com/company/finaxial",
                "https://www.facebook.com/finaxial"
              ]
            })
          }}
        />
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
