import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Optimization Software | Finaxial - AI-Driven Tax Planning',
  description: 'Maximize tax savings with AI-powered tax optimization. Our intelligent platform analyzes financial data to identify tax-saving opportunities and develop strategic tax planning solutions.',
  keywords: 'tax optimization software, tax planning, AI tax strategy, tax savings, automated tax planning, tax efficiency, corporate tax optimization, tax reduction strategies',
  openGraph: {
    title: 'Tax Optimization Software | Finaxial',
    description: 'Maximize tax savings with AI-powered tax optimization. Identify tax-saving opportunities and implement strategic planning with intelligent recommendations.',
    images: [
      {
        url: '/analytics-trends.svg',
        width: 1200,
        height: 630,
        alt: 'Finaxial Tax Optimization Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tax Optimization Software | Finaxial',
    description: 'Maximize tax savings with AI-powered tax optimization. Identify tax-saving opportunities with intelligent recommendations.',
    images: ['/analytics-trends.svg'],
  },
};
