import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Data Transformation Software | Finaxial - ETL for Finance',
  description: 'Transform raw financial data from any source into clean, standardized formats. Our AI-powered data transformation platform eliminates manual data wrangling and enables seamless integration.',
  keywords: 'financial data transformation, ETL software, financial data integration, data cleansing finance, data mapping, financial system integration, data pipeline automation',
  openGraph: {
    title: 'Financial Data Transformation Software | Finaxial',
    description: 'Transform raw financial data from any source into clean, standardized formats with our AI-powered data transformation platform.',
    images: [
      {
        url: '/window.svg',
        width: 1200,
        height: 630,
        alt: 'Finaxial Data Transformation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financial Data Transformation Software | Finaxial',
    description: 'Transform raw financial data from any source into clean, standardized formats with our AI-powered platform.',
    images: ['/window.svg'],
  },
};
