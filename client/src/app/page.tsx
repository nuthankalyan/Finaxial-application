'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from './components/Header';
import ClientWrapper from './components/ClientWrapper';
import ScrollToTopButton from './components/ScrollToTopButton';
import styles from "./page.module.css";

export default function Home() {
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
            Automate your finance management processes, end-to-end
          </h1>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/checklist-icon.svg"
                  alt="Expense Management"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Expense saved is income gained</h3>
              <p className={styles.featureDescription}>
                Digitize your expense tracking without compromising on how you want to fit it into your process. 
                Design your own custom finance apps with multi-level approval systems that ensure that spending 
                is always kept in check.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/accounting-icon.svg"
                  alt="Accounting"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>All your accounting in one place</h3>
              <p className={styles.featureDescription}>
                Manage all your accounting processes, like sales, purchases, etc., in a single custom finance 
                software, and stay updated with real-time notifications. Gain insights faster with big picture 
                views of all things finance on color-coded dashboards.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/projects-icon.svg"
                  alt="Projects"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className={styles.featureTitle}>Projects to financial projections on the go</h3>
              <p className={styles.featureDescription}>
                Be it assigning projects or studying financial projections, take work wherever you want with 
                ready-made native mobile apps, automatically available with every web-based finance app 
                developed on Finaxial.
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
              <div className={styles.faqQuestion}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>What is Finaxial and how does it work?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className={styles.faqQuestion}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>What types of financial reports and insights can I generate?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className={styles.faqQuestion}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>Can Finaxial integrate with our existing financial systems?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className={styles.faqQuestion}>
                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>How secure is our financial data with Finaxial?</h3>
                  <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
