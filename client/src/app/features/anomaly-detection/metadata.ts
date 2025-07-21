import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Anomaly Detection Software | Finaxial - AI Fraud Prevention',
  description: 'Detect financial irregularities and fraud with AI-powered anomaly detection. Our advanced algorithms identify suspicious transactions, patterns, and accounting inconsistencies in real-time.',
  keywords: 'financial anomaly detection, fraud detection software, transaction monitoring, pattern recognition finance, AI fraud detection, financial irregularities, suspicious activity detection',
  openGraph: {
    title: 'Financial Anomaly Detection Software | Finaxial',
    description: 'Detect financial irregularities and fraud with AI-powered anomaly detection. Identify suspicious transactions and patterns in real-time.',
    images: [
      {
        url: '/ai-finance-assistant.svg',
        width: 1200,
        height: 630,
        alt: 'Finaxial Anomaly Detection Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financial Anomaly Detection Software | Finaxial',
    description: 'Detect financial irregularities and fraud with AI-powered anomaly detection. Identify suspicious patterns in real-time.',
    images: ['/ai-finance-assistant.svg'],
  },
};
