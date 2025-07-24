'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from '../../components/Header';
import ClientWrapper from '../../components/ClientWrapper';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import styles from "./page.module.css";

export default function DataTransformation() {
  return (
    <main className={styles.page}>
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      
      {/* SEO-optimized headings */}
      <h1 className="sr-only">Financial Data Transformation & ETL Software | Finaxial</h1>
      
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.featureLabel}>DATA TRANSFORMATION</span>
            <h2 className={styles.heroTitle}>CSV & Excel Processing Engine</h2>
            <p className={styles.heroDescription}>
              Process, transform, and extract insights from financial spreadsheets and CSV files with our 
              powerful data transformation engine. Our system handles multiple files and formats simultaneously,
              preparing your data for compliance checks and analysis.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/signup" className={styles.primaryButton}>
                Start Free Trial
              </Link>
              <Link href="/contact" className={styles.secondaryButton}>
                Request Demo
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image 
              src="/window.svg"
              alt="Financial data transformation platform showing data pipeline flow"
              width={500}
              height={400}
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: '500px'
              }}
              priority
            />
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Key Transformation Capabilities</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/file.svg"
                  alt="Data extraction from multiple sources"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Batch File Processing</h3>
              <p className={styles.featureDescription}>
                Process multiple CSV and Excel files simultaneously with our batch processing engine that can handle
                various file formats, sizes, and structures with minimal configuration.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/analytics-trends.svg"
                  alt="AI data cleansing and normalization"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Smart Data Extraction</h3>
              <p className={styles.featureDescription}>
                Automatically identify and extract financial data from complex spreadsheets, even when data is formatted 
                inconsistently or spread across multiple sheets and files.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/ai-finance-assistant.svg"
                  alt="Automated financial data mapping"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Format Standardization</h3>
              <p className={styles.featureDescription}>
                Convert financial data from various formats into standardized structures that can be easily 
                analyzed for compliance issues and processed for automated reporting.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/globe.svg"
                  alt="Multi-system data integration"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Multi-Format Export</h3>
              <p className={styles.featureDescription}>
                Export processed data in various formats including structured CSV, Excel workbooks, PDF reports, 
                and email-ready formats for seamless distribution to stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className={styles.processSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>The File Processing Workflow</h2>
          <div className={styles.processFlow}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Upload</h3>
              <p className={styles.stepDescription}>
                Upload multiple CSV and Excel files directly through our intuitive interface. Drag-and-drop 
                functionality makes it simple to process entire folders of financial data.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Process</h3>
              <p className={styles.stepDescription}>
                Our system automatically processes files, identifying relevant financial data across 
                multiple sheets and formats while maintaining data relationships.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Check</h3>
              <p className={styles.stepDescription}>
                The system performs compliance checks against GAAP, IFRS, and SOX requirements to identify 
                potential issues in your financial data before reporting.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Report</h3>
              <p className={styles.stepDescription}>
                Generate comprehensive reports with identified anomalies and compliance issues, formatted for 
                email distribution with PDF attachments to key stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Business Benefits</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Time Savings</h3>
              <p className={styles.benefitDescription}>
                Process multiple financial files in minutes instead of hours, freeing up your finance team 
                to focus on analysis rather than manual data preparation.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Compliance Assurance</h3>
              <p className={styles.benefitDescription}>
                Ensure your financial data meets GAAP, IFRS, and SOX requirements with automated compliance checks 
                that identify potential issues before they become regulatory problems.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Error Reduction</h3>
              <p className={styles.benefitDescription}>
                Eliminate manual data entry errors with automated processing that consistently handles 
                financial data according to predefined rules and data validation checks.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Actionable Insights</h3>
              <p className={styles.benefitDescription}>
                Gain deeper visibility into your financial data with automated processing that extracts 
                meaningful patterns and highlights areas requiring attention or further analysis.
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
              "Finaxial transformed how we handle our CSV and Excel files for quarterly reporting. What used to take 
              our team an entire week of manual processing now happens automatically in less than an hour, with better 
              accuracy and comprehensive compliance checks against our IFRS requirements."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <span className={styles.authorName}>Emily Wong</span>
              <span className={styles.authorTitle}>Financial Controller, Meridian Healthcare</span>
            </div>
            <div className={styles.caseStudyResults}>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>95%</span>
                <span className={styles.resultLabel}>Reduction in Data Prep Time</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>99.7%</span>
                <span className={styles.resultLabel}>Data Accuracy</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>$280K</span>
                <span className={styles.resultLabel}>Annual Cost Savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to transform your financial data processes?</h2>
          <p className={styles.ctaDescription}>
            Join hundreds of finance teams using Finaxial's data transformation platform to streamline operations.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/signup" className={styles.primaryButton}>
              Start Free Trial
            </Link>
            <Link href="/contact" className={styles.outlineButton}>
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What types of financial data sources can be transformed?</h3>
              <p className={styles.faqAnswer}>
                Our platform can extract and transform data from virtually any source including accounting systems, 
                ERP platforms, CRM tools, spreadsheets, databases, APIs, PDFs, bank statements, invoices, receipts, 
                and even scanned documents using OCR technology.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Do I need programming skills to use the data transformation platform?</h3>
              <p className={styles.faqAnswer}>
                No, our platform features a visual, no-code interface designed for finance professionals. You can create 
                sophisticated data transformation workflows using our drag-and-drop pipeline builder, without writing any code. 
                For advanced users, we also offer a Python SDK for custom transformations.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How does the platform handle data security and compliance?</h3>
              <p className={styles.faqAnswer}>
                Security is built into every aspect of our platform. We maintain SOC 2 Type II certification, employ 
                bank-level encryption for data at rest and in transit, and offer comprehensive audit trails. The platform 
                also includes features for GDPR, CCPA, and other regulatory compliance requirements.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can transformations be scheduled or triggered automatically?</h3>
              <p className={styles.faqAnswer}>
                Yes, you can schedule transformations to run at specific intervals (hourly, daily, weekly, etc.) or set up 
                event-based triggers that initiate transformations when new data arrives or certain conditions are met. 
                Our platform also supports real-time data streaming for continuously updated financial insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className={styles.seoSection}>
        <div className={styles.container}>
          <h2 className={styles.seoTitle}>Financial Data Transformation & ETL Software</h2>
          <div className={styles.seoContent}>
            <p>
              Finaxial's financial data transformation platform provides organizations with powerful tools to extract, 
              transform, and load (ETL) financial data from any source into clean, standardized formats ready for analysis 
              and reporting. Our AI-powered solution eliminates the manual, error-prone processes that typically consume 
              finance teams' valuable time.
            </p>
            <p>
              Key capabilities include unified data extraction from multiple sources, intelligent data cleansing with 
              financial-specific validation rules, smart data mapping powered by machine learning, and seamless integration 
              with destination systems. Unlike generic ETL tools, our platform is built specifically for the complexities 
              of financial data, with built-in understanding of accounting structures, financial reporting requirements, 
              and regulatory compliance needs.
            </p>
            <p>
              Organizations across industries rely on our data transformation capabilities to consolidate financial data 
              from disparate systems, standardize information across subsidiaries and departments, prepare data for 
              reporting and analysis, and ensure data integrity throughout their financial operations.
            </p>
            <p>
              Whether you're dealing with complex data consolidation challenges, struggling with inconsistent financial 
              data formats across systems, or simply spending too much time on manual data preparation, Finaxial's data 
              transformation platform provides the intelligent automation you need to achieve clean, consistent financial 
              data that drives better business decisions.
            </p>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
