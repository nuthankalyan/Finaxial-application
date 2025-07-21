'use client';

import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from './components/Header';
import ClientWrapper from './components/ClientWrapper';
import ScrollToTopButton from './components/ScrollToTopButton';
import { SparklesCore } from './components/ui/SparklesCore';
import styles from "./page.module.css";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <main className={styles.page} itemScope itemType="https://schema.org/WebPage">
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      {/* Hidden heading for screen readers and SEO */}
      <h1 className="sr-only">Finaxial - AI-Powered Financial Analytics and Reporting Platform</h1>      <section className={styles.heroSection} aria-labelledby="hero-heading">        <div className={styles.sparklesWrapper}>
          <SparklesCore
            id="tsparticlesfull"
            background="transparent" 
            minSize={0.6}
            maxSize={2.4}
            particleColor="#FFFFFF"
            particleDensity={80}
            speed={2}
            className={styles.sparklesContainer}
          />
          <div className={styles.tag} role="doc-subtitle">INTELLIGENT FINANCIAL MANAGEMENT PLATFORM</div>
          <div className={styles.heroWrapper}>
            <div className={styles.heroText}>
              <h2 id="hero-heading" className={styles.heroTitle}>
                Transform Financial Data into Strategic Insights
              </h2>
              <p className={styles.heroSubtitle}>
                Automate financial reporting with AI-powered anomaly detection, compliance checks, and tax optimization to save time, reduce risk, and maximize financial performance
              </p>
              <div className={styles.heroButtons}>              
                <Link href="/login" className={styles.primaryButton}>
                  Get Started
                </Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.dashboardPreview}>
                <div className={styles.dashboardHeader}>
                  <div className={styles.dashboardTitle}>Financial Overview</div>
                  <div className={styles.dashboardDate}>June 2025</div>
                </div>
                <div className={styles.dashboardGrid}>
                  <div className={styles.dashboardCard}>
                    <div className={styles.cardLabel}>Total Revenue</div>
                    <div className={styles.cardValue}>$847,392</div>
                    <div className={`${styles.cardTrend} ${styles.positive}`}>+12.8%</div>
                  </div>
                  <div className={styles.dashboardCard}>
                    <div className={styles.cardLabel}>Expenses</div>
                    <div className={styles.cardValue}>$235,841</div>
                    <div className={`${styles.cardTrend} ${styles.negative}`}>-3.2%</div>
                  </div>
                  <div className={styles.dashboardCard}>
                    <div className={styles.cardLabel}>Net Profit</div>
                    <div className={styles.cardValue}>$611,551</div>
                    <div className={`${styles.cardTrend} ${styles.positive}`}>+18.5%</div>
                  </div>
                  <div className={styles.dashboardChart}>
                    <div className={styles.chartTitle}>Revenue Trend</div>
                    <div className={styles.chartBars}>
                      <div className={`${styles.chartBar} ${styles.bar60}`}></div>
                      <div className={`${styles.chartBar} ${styles.bar75}`}></div>
                      <div className={`${styles.chartBar} ${styles.bar45}`}></div>
                      <div className={`${styles.chartBar} ${styles.bar90}`}></div>
                      <div className={`${styles.chartBar} ${styles.bar85}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection} aria-labelledby="features-heading">
        <div className={styles.sectionContainer}>
          <h2 id="features-heading" className={styles.mainTitle}>
            Powerful features to streamline your financial workflows
          </h2>
          
          <div className={styles.featureGrid}>
            <Link href="/features/anomaly-detection" className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/ai-finance-assistant.svg"
                  alt="AI-powered anomaly detection icon showing financial data pattern analysis"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Intelligent Anomaly Detection</h3>
              <p className={styles.featureDescription}>
                Our advanced AI algorithms automatically identify irregular patterns and outliers in your financial data. 
                Detect potential fraud, errors, or unusual transactions before they impact your business, with real-time 
                alerts and comprehensive audit trails.
              </p>
              <span className={styles.featureLink}>Learn more →</span>
            </Link>

            <Link href="/features/compliance-automation" className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/file.svg"
                  alt="Regulatory compliance and financial documentation icon"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Compliance & Regulation Checks</h3>
              <p className={styles.featureDescription}>
                Stay ahead of changing financial regulations with our built-in compliance monitoring system. 
                Automatically validate your financial data against the latest regulatory requirements, reducing 
                risk and ensuring all reports meet industry standards.
              </p>
              <span className={styles.featureLink}>Learn more →</span>
            </Link>

            <Link href="/features/data-transformation" className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/window.svg"
                  alt="Data Transformation"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Seamless Data Transformation</h3>
              <p className={styles.featureDescription}>
                Convert and normalize data from multiple sources into standardized formats instantly. 
                Our powerful ETL tools handle complex financial data structures, making integration with your 
                existing systems effortless while maintaining data integrity.
              </p>
              <span className={styles.featureLink}>Learn more →</span>
            </Link>

            <Link href="/features/tax-optimization" className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/analytics-trends.svg"
                  alt="Tax Optimization"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Tax Optimization Analysis</h3>
              <p className={styles.featureDescription}>
                Identify tax-saving opportunities with our intelligent tax optimization engine. Analyze spending patterns, 
                investment strategies, and business operations to recommend actionable tax efficiency improvements, potentially 
                saving your business significant amounts.
              </p>
              <span className={styles.featureLink}>Learn more →</span>
            </Link>

            <Link href="/features/financial-reporting" className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/pdf-export.svg"
                  alt="Detailed Reports"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Comprehensive Financial Reports</h3>
              <p className={styles.featureDescription}>
                Generate detailed, presentation-ready reports with just a few clicks. Choose from industry-standard templates 
                or create custom reports with interactive visualizations that bring your financial data to life and make complex 
                information easy to understand.
              </p>
              <span className={styles.featureLink}>Learn more →</span>
            </Link>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/email-automation.svg"
                  alt="Smart Email Reports"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Smart Email Reports</h3>
              <p className={styles.featureDescription}>
                Schedule and receive automated financial reports directly in your inbox. Set custom delivery frequencies and 
                content filters to ensure key stakeholders get exactly the information they need, when they need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className={styles.analyticsSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            Advanced Analytics for Financial Excellence
          </h2>
          <div className={styles.analyticsFeatures}>
            <div className={styles.analyticsFeature}>
              <div className={styles.featureVisual}>
                <Image
                  src="/customizable-reports.svg"
                  alt="Customizable Reports"
                  width={400}
                  height={300}
                  className={styles.featureImage}
                />
              </div>
              <h3>Interactive Financial Dashboards</h3>
              <p>Create tailored dashboards with drag-and-drop simplicity, combining multiple data sources into unified visualizations that reveal actionable insights instantly.</p>
            </div>
            <div className={styles.analyticsFeature}>
              <div className={styles.featureVisual}>
                <Image
                  src="/template-reports.svg"
                  alt="Regulatory Compliance"
                  width={400}
                  height={300}
                  className={styles.featureImage}
                />
              </div>
              <h3>Regulatory Compliance Framework</h3>
              <p>Automatically apply industry-specific regulatory requirements to your financial processes, with built-in audit trails and validation checks to ensure continuous compliance.</p>
            </div>
            <div className={styles.analyticsFeature}>
              <div className={styles.featureVisual}>
                <Image
                  src="/analytics-trends.svg"
                  alt="Predictive Analysis"
                  width={400}
                  height={300}
                  className={styles.featureImage}
                />
              </div>
              <h3>Predictive Financial Analysis</h3>
              <p>Leverage machine learning algorithms to forecast financial trends, detect anomalies before they impact your business, and receive AI-powered recommendations for optimizing performance.</p>
            </div>
            <div className={styles.analyticsFeature}>
              <div className={styles.featureVisual}>
                <Image
                  src="/projects-icon.svg"
                  alt="Data Transformation"
                  width={400}
                  height={300}
                  className={styles.featureImage}
                />
              </div>
              <h3>Intelligent Data Transformation</h3>
              <p>Transform complex financial data from any source into standardized formats with our automated ETL pipeline, ensuring consistency and accuracy across all your financial reporting.</p>
            </div>
          </div>
        </div>
      </section>      {/* Testimonial Section */}
      <section className={styles.testimonialSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.metricsHighlight}>
            <span className={styles.metricNumber}>60+</span>
            <span className={styles.metricLabel}>Financial Workflows Automated</span>
          </div>

          <h2 className={styles.sectionTitle}>
            Trusted by Leading Companies Worldwide
          </h2>
          
          <div className={styles.trustCardGrid}>
            <div className={styles.trustCard}>
              <blockquote className={styles.testimonialQuote}>
                "Finaxial's anomaly detection system identified an accounting discrepancy that saved us over $2M last quarter. The compliance checks have reduced our regulatory review time by 75%, making our audits virtually stress-free."
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorName}>Sarah Johnson</span>
                <span className={styles.authorRole}>Chief Financial Officer, Global Finance Partners</span>
              </div>
            </div>

            <div className={styles.trustCard}>
              <blockquote className={styles.testimonialQuote}>
                "The tax optimization module identified $430,000 in potential savings we would have otherwise missed. Their data transformation tools seamlessly integrated with our legacy systems, eliminating months of manual work."
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorName}>Michael Chen</span>
                <span className={styles.authorRole}>Head of Financial Operations, TechCorp International</span>
              </div>
            </div>

            <div className={styles.trustCard}>
              <blockquote className={styles.testimonialQuote}>
                "Our board members rave about the detailed report pages. The visualizations make complex financial data instantly understandable, and the automated compliance checks give us confidence that we're always operating within regulatory guidelines."
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorName}>Emily Wong</span>
                <span className={styles.authorRole}>Director of Finance, Global Investments Ltd</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqContainer}>
          <div>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>            <div className={styles.faqList}>
              <div className={`${styles.faqQuestion} ${activeFaq === 0 ? styles.active : ''}`} onClick={() => toggleFaq(0)}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>How does Finaxial analyze my financial data?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Finaxial uses advanced AI and machine learning to analyze your financial data:</p>
                  <ul>
                    <li>Upload your CSV files containing financial data</li>
                    <li>Our AI processes and identifies key patterns and trends</li>
                    <li>Generates detailed insights and visualizations in real-time</li>
                    <li>Provides actionable recommendations based on your data</li>
                    <li>Automatically creates PDF reports for easy sharing</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.faqQuestion} ${activeFaq === 1 ? styles.active : ''}`} onClick={() => toggleFaq(1)}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>How does Finaxial's anomaly detection work?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Finaxial's anomaly detection system uses advanced machine learning:</p>
                  <ul>
                    <li>Analyzes historical financial patterns to establish baselines</li>
                    <li>Continuously monitors transactions and financial entries in real-time</li>
                    <li>Flags unusual activities based on statistical deviations and learned patterns</li>
                    <li>Provides detailed anomaly reports with risk assessment scores</li>
                    <li>Adapts over time to your organization's evolving financial patterns</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.faqQuestion} ${activeFaq === 2 ? styles.active : ''}`} onClick={() => toggleFaq(2)}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>How does Finaxial help with regulatory compliance?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Our comprehensive compliance solution includes:</p>
                  <ul>
                    <li>Automated validation against current financial regulations</li>
                    <li>Regular updates to compliance rules based on regulatory changes</li>
                    <li>Detailed audit trails for all financial transactions</li>
                    <li>Pre-built compliance report templates for common regulatory frameworks</li>
                    <li>Compliance risk scoring and proactive violation prevention</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.faqQuestion} ${activeFaq === 3 ? styles.active : ''}`} onClick={() => toggleFaq(3)}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>What makes Finaxial's AI assistant unique?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Our AI assistant stands out with its specialized financial expertise:</p>
                  <ul>
                    <li>Deep understanding of financial data and metrics</li>
                    <li>Natural language processing for complex queries</li>
                    <li>Personalized insights based on your data patterns</li>
                    <li>Continuous learning and adaptation</li>
                    <li>Integration with advanced analytics tools</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.faqQuestion} ${activeFaq === 4 ? styles.active : ''}`} onClick={() => toggleFaq(4)}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>How do I get started with Finaxial?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Getting started with Finaxial is quick and straightforward:</p>
                  <ul>
                    <li>Sign up for a free account</li>
                    <li>Create your first workspace</li>
                    <li>Upload your financial data</li>
                    <li>Access AI-powered insights instantly</li>
                    <li>Customize your reporting preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.contactBox}>
            <h3 className={styles.contactTitle}>If you have any further questions,</h3>
            <p className={styles.contactText}>Get in touch with our friendly team.</p>
            <Link href="/contact" className={styles.contactLink}>
              Get in touch
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <div className={styles.sparklesWrapper}>
          <SparklesCore
            id="footerSparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.8}
            particleColor="#FFFFFF"
            particleDensity={60}
            speed={1.5}
            className={styles.sparklesContainer}
          />
          <div className={styles.sectionContainer}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Ready to transform your financial workflows?</h2>
              <p className={styles.ctaText}>Join thousands of companies using Finaxial to automate their financial reporting</p>
              <div className={styles.seoContent}>
                <p>Experience the power of AI-driven financial analysis with advanced anomaly detection, comprehensive compliance checks, and tax optimization tools. Our platform helps businesses of all sizes transform raw financial data into actionable insights.</p>
              </div>
              <Link href="/login" className={styles.primaryButton}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
