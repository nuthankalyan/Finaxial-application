import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Reporting Software | Finaxial - Automated Report Generation',
  description: 'Transform financial data into clear, insightful reports and interactive dashboards. Create stunning financial statements, management reports, and regulatory filings with our AI-powered platform.',
  keywords: 'financial reporting software, automated financial reports, interactive financial dashboards, financial statements, management reporting, regulatory filings, financial data visualization',
  openGraph: {
    title: 'Financial Reporting Software | Finaxial',
    description: 'Transform financial data into clear, insightful reports and interactive dashboards. Create stunning financial statements and management reports.',
    images: [
      {
        url: '/customizable-reports.svg',
        width: 1200,
        height: 630,
        alt: 'Finaxial Financial Reporting Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financial Reporting Software | Finaxial',
    description: 'Transform financial data into clear, insightful reports and interactive dashboards with our AI-powered platform.',
    images: ['/customizable-reports.svg'],
  },
};
