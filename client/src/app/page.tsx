'use client';

import Image from "next/image";
import Header from './components/Header';
import ClientWrapper from './components/ClientWrapper';
import styles from "./page.module.css";
import Link from "next/link";
import ScrollToTopButton from './components/ScrollToTopButton';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center relative">
      {/* Header */}
      <ClientWrapper>
        <Header />
      </ClientWrapper>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto px-4 py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight fade-in-up">
                Financial Insights <span className="text-secondary-300">Automated</span> with AI
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 fade-in-up delay-200">
                Transforming financial data into actionable intelligence for institutions using generative AI.
              </p>
              <div className="pt-4 flex flex-wrap gap-4 fade-in-up delay-300">
                <Link href="/signup">
                  <button className="btn btn-primary hover-scale">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative fade-in-left delay-400">
              <div className="animated-bg w-full h-96 rounded-xl shadow-2xl flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="floating">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful AI-Driven Financial Analysis
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform leverages cutting-edge generative AI to transform raw financial data into valuable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card dark:bg-gray-800 fade-in-up delay-100">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h3 className="feature-title">
                Automated Financial Reporting
              </h3>
              <p className="feature-description">
                Generate comprehensive financial reports automatically with AI that understands complex financial data structures.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card dark:bg-gray-800 fade-in-up delay-200">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m2 9 3-3 3 3" />
                  <path d="M8 6v12" />
                  <path d="m22 15-3 3-3-3" />
                  <path d="M16 18V6" />
                  <rect x="9" y="3" width="6" height="18" rx="2" />
                </svg>
              </div>
              <h3 className="feature-title">
                Trend Analysis & Forecasting
              </h3>
              <p className="feature-description">
                Identify hidden patterns and predict future financial trends with advanced machine learning algorithms.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card dark:bg-gray-800 fade-in-up delay-300">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v4h13" />
                  <path d="M4 7h4" />
                  <path d="M22 11H9v4h13" />
                  <path d="M4 11h4" />
                  <path d="M8 19H4" />
                  <path d="M12 19h-4v-4" />
                </svg>
              </div>
              <h3 className="feature-title">
                Risk Assessment
              </h3>
              <p className="feature-description">
                Evaluate potential risks with AI-powered analysis that considers multiple factors and historical data points.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonials" className="w-full py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Financial Leaders
            </h2>
          </div>

          <div className="testimonial fade-in-up delay-200">
            <div className="flex flex-col items-center text-center">
              <div className="feature-icon w-20 h-20 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600 dark:text-primary-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </div>
              <blockquote className="testimonial-text">
                "Finaxial has transformed how we process and analyze financial data. The AI-driven insights have helped us make better decisions faster than ever before."
              </blockquote>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</p>
                <p className="text-gray-600 dark:text-gray-300">CFO, Global Finance Partners</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta-section">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 fade-in-up">
            Ready to Transform Your Financial Insights?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto fade-in-up delay-100">
            Join the financial institutions already leveraging our generative AI platform to gain deeper insights and make data-driven decisions.
          </p>
          <div className="flex flex-wrap justify-center gap-4 fade-in-up delay-200">
            <Link href="/signup">
              <button className="btn btn-primary hover-scale">
                Get Started Today
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll to top button */}
      <ScrollToTopButton />
      
      {/* Set CSS variables for the button */}
      <style jsx global>{`
        :root {
          --primary-color: #3b82f6;
          --secondary-color: #8b5cf6;
        }
      `}</style>
    </main>
  );
}
