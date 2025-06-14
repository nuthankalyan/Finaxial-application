'use client';

import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from './components/Header';
import ClientWrapper from './components/ClientWrapper';
import ScrollToTopButton from './components/ScrollToTopButton';
import styles from "./page.module.css";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <main className={styles.page}>
      <ClientWrapper>
        <Header />
      </ClientWrapper>

      <section className={styles.heroSection}>
        <div className={styles.tag}>AUTOMATED FINANCIAL REPORTS SOFTWARE</div>
        <div className={styles.heroWrapper}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Digitize & automate financial reports
            </h1>
            <p className={styles.heroSubtitle}>
              Shorten the time for your finance team to collect data, generate bespoke reports and manage everchanging regulations & policies
            </p>
            <div className={styles.heroButtons}>              <Link href="/login" className={styles.primaryButton}>
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
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <h1 className={styles.mainTitle}>
            Powerful features to streamline your financial workflows
          </h1>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/email-automation.svg"
                  alt="Smart Email Reports"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Smart Email Reports at Your Fingertips</h3>
              <p className={styles.featureDescription}>
                Receive automated financial reports directly in your inbox, scheduled to your preferences. 
                Stay informed with custom alerts and real-time updates on your financial metrics, delivered 
                seamlessly to your email.
              </p>
            </div>

            <div className={styles.featureCard}>              <div className={styles.featureIcon}>
                <Image
                  src="/ai-finance-assistant.svg"
                  alt="AI Financial Assistant"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>24/7 AI Financial Assistant</h3>
              <p className={styles.featureDescription}>
                Get instant answers to your financial queries with our intelligent AI chatbot. From expense 
                tracking to budget analysis, receive smart insights and recommendations in real-time, 
                helping you make informed decisions faster.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/pdf-export.svg"
                  alt="PDF Export"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>One-Click PDF Reports Export</h3>
              <p className={styles.featureDescription}>
                Transform your financial data into professional PDF reports with a single click. Generate 
                beautifully formatted summaries, complete with charts and insights, perfect for 
                presentations and record-keeping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className={styles.analyticsSection}>
        <div className={styles.sectionContainer}>          <h2 className={styles.sectionTitle}>
            Gain visibility into financial workload and performance
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
              <h3>Customizable Reports</h3>
              <p>Create your own reports and visualization fit for your team's unique metrics and fields.</p>
            </div>
            <div className={styles.analyticsFeature}>
              <div className={styles.featureVisual}>
                <Image
                  src="/template-reports.svg"
                  alt="Template Reports"
                  width={400}
                  height={300}
                  className={styles.featureImage}
                />
              </div>
              <h3>Template Reports</h3>
              <p>Leverage our ready-to-use legal reports to measure industry standard metrics and implement faster.</p>
            </div>
            <div className={styles.analyticsFeature}>
              <div className={styles.featureVisual}>
                <Image
                  src="/analytics-trends.svg"
                  alt="Analytics and Trends"
                  width={400}
                  height={300}
                  className={styles.featureImage}
                />
              </div>
              <h3>Analytics and Trends</h3>
              <p>Use analytics to see trends in matter volume, status and type to identify seasonality and capacity gaps.</p>
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
                "Finaxial has revolutionized our financial workflows, making them more efficient and accurate than ever before. The automation capabilities have transformed our entire finance department."
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorName}>Sarah Johnson</span>
                <span className={styles.authorRole}>Chief Financial Officer, Global Finance Partners</span>
              </div>
            </div>

            <div className={styles.trustCard}>
              <blockquote className={styles.testimonialQuote}>
                "The AI-driven insights have transformed how we process and analyze financial data. We've seen a 40% reduction in processing time and improved accuracy across all reports."
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorName}>Michael Chen</span>
                <span className={styles.authorRole}>Head of Financial Operations, TechCorp International</span>
              </div>
            </div>

            <div className={styles.trustCard}>
              <blockquote className={styles.testimonialQuote}>
                "A game-changer for our financial operations. The automated workflows and intelligent reporting have helped us scale our operations while maintaining perfect accuracy."
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
                  <h3 className={styles.questionText}>What kind of visualizations does Finaxial provide?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Finaxial offers a comprehensive suite of data visualizations:</p>
                  <ul>
                    <li>Interactive charts and graphs for trend analysis</li>
                    <li>Financial performance dashboards</li>
                    <li>Customizable report templates</li>
                    <li>Real-time data monitoring displays</li>
                    <li>Comparative analysis visualizations</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.faqQuestion} ${activeFaq === 2 ? styles.active : ''}`} onClick={() => toggleFaq(2)}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>How do I share reports with my team?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.faqAnswer}>
                  <p>Sharing reports with your team is simple and secure:</p>
                  <ul>
                    <li>Export reports in multiple formats (PDF, Excel, etc.)</li>
                    <li>Share via secure email links</li>
                    <li>Collaborate in real-time through shared workspaces</li>
                    <li>Set custom access permissions for team members</li>
                    <li>Schedule automated report distributions</li>
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
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <div className={styles.sectionContainer}>
          <div className={styles.ctaContent}>            <Link href="/login" className={styles.primaryButton}>
              Get Started
            </Link>
            
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
