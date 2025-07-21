'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from '../../components/Header';
import ClientWrapper from '../../components/ClientWrapper';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import styles from "./page.module.css";

export default function FinancialReporting() {
  return (
    <main className={styles.page}>
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      
      {/* SEO-optimized headings */}
      <h1 className="sr-only">Advanced Financial Reporting Software | Finaxial</h1>
      
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.featureLabel}>FINANCIAL REPORTING</span>
            <h2 className={styles.heroTitle}>Advanced Financial Report Distribution</h2>
            <p className={styles.heroDescription}>
              Generate professional financial reports and distribute them effortlessly with our integrated email system. 
              Create comprehensive PDF reports with your financial data analysis and share them directly with stakeholders 
              through our secure, branded email templates.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/signup" className={styles.primaryButton}>
                Start Free Trial
              </Link>
              <Link href="/contact" className={styles.secondaryButton}>
                View Demo Reports
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image 
              src="/customizable-reports.svg"
              alt="Financial reporting dashboard with interactive financial reports and analytics"
              width={500}
              height={400}
            />
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Powerful Reporting Capabilities</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/template-reports.svg"
                  alt="Customizable financial report templates"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Customizable Templates</h3>
              <p className={styles.featureDescription}>
                Access a library of professional report templates including balance sheets, income statements, 
                cash flow statements, variance analysis, and management reports—all fully customizable.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/analytics-trends.svg"
                  alt="Interactive financial visualizations and charts"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Professional PDF Reports</h3>
              <p className={styles.featureDescription}>
                Generate comprehensive PDF reports with executive summaries, detailed analysis, data visualizations, and 
                tabular data. All reports feature professional formatting and FinAxial branding.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/email-automation.svg"
                  alt="Automated financial report distribution"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Branded Email Distribution</h3>
              <p className={styles.featureDescription}>
                Send your generated PDF reports directly via email with our professional, responsive email templates featuring 
                FinAxial branding, executive summaries, and personalized messages for recipients.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/pdf-export.svg"
                  alt="Multi-format financial report exports"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Integrated Email Workflow</h3>
              <p className={styles.featureDescription}>
                Seamlessly move from report generation to email distribution with our intuitive user interface. Add recipient details, 
                customize your message, and send the exact same PDF reports that you can download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reports Showcase */}
      <section className={styles.reportsShowcase}>
        <div className={styles.container}>
          <h2 className={styles.showcaseTitle}>Report Types & Examples</h2>
          <div className={styles.reportTypesContainer}>
            <div className={styles.reportTypes}>
              <div className={styles.reportType}>
                <div className={styles.reportImage}>
                  <Image
                    src="/email-report-preview.png"
                    alt="Financial statement report example"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.reportContent}>
                  <h3 className={styles.reportName}>Financial Statements</h3>
                  <p className={styles.reportDescription}>
                    Professional balance sheets, income statements, and cash flow statements with automatic GAAP/IFRS compliance.
                  </p>
                  <Link href="/demo/financial-statements" className={styles.viewReportButton}>
                    View Example
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>

              <div className={styles.reportType}>
                <div className={styles.reportImage}>
                  <Image
                    src="/email-report-preview.png"
                    alt="Management reporting dashboard"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.reportContent}>
                  <h3 className={styles.reportName}>Management Dashboards</h3>
                  <p className={styles.reportDescription}>
                    Executive KPI dashboards with drill-down capabilities for detailed analysis of business performance.
                  </p>
                  <Link href="/demo/management-dashboards" className={styles.viewReportButton}>
                    View Example
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>

              <div className={styles.reportType}>
                <div className={styles.reportImage}>
                  <Image
                    src="/email-report-preview.png"
                    alt="Regulatory compliance report"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.reportContent}>
                  <h3 className={styles.reportName}>Regulatory Reports</h3>
                  <p className={styles.reportDescription}>
                    Compliance-focused reports for SEC filings, tax authorities, and industry-specific regulators.
                  </p>
                  <Link href="/demo/regulatory-reports" className={styles.viewReportButton}>
                    View Example
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>

              <div className={styles.reportType}>
                <div className={styles.reportImage}>
                  <Image
                    src="/email-report-preview.png"
                    alt="Investor relations presentation"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.reportContent}>
                  <h3 className={styles.reportName}>Investor Relations</h3>
                  <p className={styles.reportDescription}>
                    Professional investor decks and earnings reports with automated updates from your financial data.
                  </p>
                  <Link href="/demo/investor-relations" className={styles.viewReportButton}>
                    View Example
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Business Benefits</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Time Efficiency</h3>
              <p className={styles.benefitDescription}>
                Reduce financial reporting time by up to 80% with automated data aggregation, calculations, 
                and report generation that eliminates manual processes.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Enhanced Accuracy</h3>
              <p className={styles.benefitDescription}>
                Eliminate human errors with automated calculations, data validation rules, and consistent 
                methodology application across all reports.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Better Decision-Making</h3>
              <p className={styles.benefitDescription}>
                Provide stakeholders with clear, timely insights through interactive visualizations and 
                easy-to-understand financial narratives.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Compliance & Control</h3>
              <p className={styles.benefitDescription}>
                Maintain robust audit trails, version control, and approval workflows to support regulatory 
                compliance and financial governance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.caseStudySection}>
        <div className={styles.container}>
          <div className={styles.caseStudyContent}>
            <h2 className={styles.caseStudyTitle}>Customer Success Story</h2>
            <blockquote className={styles.testimonial}>
              "Finaxial's reporting platform transformed our month-end close process from a two-week marathon 
              to a three-day sprint. The automated reports are more accurate and insightful than our previous 
              manual process, giving our executives the timely information they need to make critical decisions."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <span className={styles.authorName}>Robert Chen</span>
              <span className={styles.authorTitle}>Financial Controller, Global Manufacturing Corp.</span>
            </div>
            <div className={styles.caseStudyResults}>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>75%</span>
                <span className={styles.resultLabel}>Reduction in Reporting Time</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>99.8%</span>
                <span className={styles.resultLabel}>Report Accuracy</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>$420K</span>
                <span className={styles.resultLabel}>Annual Cost Savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to transform your financial reporting?</h2>
          <p className={styles.ctaDescription}>
            Join hundreds of finance teams using Finaxial to create insightful, automated financial reports.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/signup" className={styles.primaryButton}>
              Start Free Trial
            </Link>
            <Link href="/contact" className={styles.outlineButton}>
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How quickly can we implement the reporting system?</h3>
              <p className={styles.faqAnswer}>
                Most customers are up and running with their first automated reports within 2-4 weeks. Our implementation team 
                will work with you to connect your data sources, configure report templates, and train your team on the platform.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can the system integrate with our existing financial systems?</h3>
              <p className={styles.faqAnswer}>
                Yes, our platform integrates with all major ERP systems, accounting software, and financial databases including 
                SAP, Oracle, NetSuite, QuickBooks, Sage, and Microsoft Dynamics. We also support custom API connections to 
                proprietary systems.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How does the system handle data security and privacy?</h3>
              <p className={styles.faqAnswer}>
                Security is our top priority. We maintain bank-level encryption for all data, SOC 2 Type II certification, 
                role-based access controls, and detailed audit logs. All reports and data access can be restricted based on 
                user roles and permissions.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can we customize reports to match our brand and reporting standards?</h3>
              <p className={styles.faqAnswer}>
                Absolutely. All report templates can be fully customized with your company's branding, preferred terminology, 
                and reporting formats. Our platform supports custom CSS for advanced styling and white-labeled distribution options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className={styles.seoSection}>
        <div className={styles.container}>
          <h2 className={styles.seoTitle}>Advanced Financial Reporting Software</h2>
          <div className={styles.seoContent}>
            <p>
              Finaxial's financial reporting software provides finance teams with powerful tools to transform raw financial 
              data into clear, insightful reports and interactive dashboards. Our platform streamlines the entire reporting 
              process from data collection to distribution, helping organizations of all sizes produce professional financial 
              statements, management reports, and regulatory filings with unprecedented efficiency.
            </p>
            <p>
              Key capabilities include customizable report templates, interactive data visualizations, automated report distribution, 
              and multi-format export options. Unlike traditional financial reporting tools, our AI-powered platform learns from 
              your data patterns to highlight key insights and anomalies, bringing attention to the metrics that matter most.
            </p>
            <p>
              Whether you need to produce GAAP/IFRS-compliant financial statements, management dashboards, regulatory filings, or 
              investor relations materials, our comprehensive financial reporting solution provides the flexibility and power to 
              meet your specific requirements while reducing manual effort and improving accuracy.
            </p>
            <p>
              Finance leaders at organizations across industries rely on Finaxial's reporting platform to accelerate their 
              reporting cycles, improve data accuracy, and deliver more meaningful financial insights to stakeholders. With 
              our intuitive interface and powerful automation capabilities, your team can focus less on report production and 
              more on strategic financial analysis.
            </p>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
