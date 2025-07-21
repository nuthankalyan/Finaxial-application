'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from '../../components/Header';
import ClientWrapper from '../../components/ClientWrapper';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import styles from "./page.module.css";

export default function AnomalyDetection() {
  return (
    <main className={styles.page}>
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      
      {/* SEO-optimized headings */}
      <h1 className="sr-only">AI Financial Anomaly Detection Software | Finaxial</h1>
      
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.featureLabel}>FINANCIAL ANOMALY DETECTION</span>
            <h2 className={styles.heroTitle}>AI-Powered Financial Data Anomaly Detection</h2>
            <p className={styles.heroDescription}>
              Automatically scan your CSV and Excel financial data for irregularities, outliers, and suspicious patterns 
              using our advanced AI algorithms. Detect potential errors, fraud, and unusual transactions with visual 
              highlighting and detailed explanations for each detected anomaly.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/signup" className={styles.primaryButton}>
                Try Anomaly Detection
              </Link>
              <Link href="/contact" className={styles.secondaryButton}>
                Request Demo
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image 
              src="/ai-finance-assistant.svg"
              alt="Financial anomaly detection system detecting unusual patterns in financial data"
              width={500}
              height={400}
            />
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How Our Anomaly Detection Works</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/analytics-trends.svg"
                  alt="Pattern recognition in financial data"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Intelligent Pattern Recognition</h3>
              <p className={styles.featureDescription}>
                Our AI algorithms analyze historical financial transactions to establish normal patterns, then continuously 
                monitor new transactions to identify deviations that could indicate fraud or errors.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/customizable-reports.svg"
                  alt="Real-time anomaly alerts"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Multi-File Anomaly Scanning</h3>
              <p className={styles.featureDescription}>
                Upload and scan multiple CSV and Excel files simultaneously to detect anomalies across your entire financial dataset.
                Process all sheets at once with our efficient batch processing system.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/window.svg"
                  alt="Risk assessment scoring system"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Pattern Recognition AI</h3>
              <p className={styles.featureDescription}>
                Our sophisticated machine learning algorithms learn from your financial data patterns, identifying 
                outliers and suspicious transactions that don't fit established patterns in your organization.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/template-reports.svg"
                  alt="Comprehensive audit trails for financial transactions"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Compliance Verification</h3>
              <p className={styles.featureDescription}>
                Automatically cross-reference detected anomalies against relevant financial regulations including GAAP, IFRS, 
                and SOX requirements to ensure compliance and identify potential reporting issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Benefits of AI Anomaly Detection</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Automated Anomaly Reporting</h3>
              <p className={styles.benefitDescription}>
                Receive comprehensive reports of detected anomalies with detailed explanations and context, delivered 
                automatically to stakeholders via email with PDF attachments for easier review.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Compliance Adherence</h3>
              <p className={styles.benefitDescription}>
                Ensure your financial data complies with GAAP, IFRS, and SOX requirements through systematic anomaly detection 
                that flags potential compliance issues before they become regulatory problems.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Time Efficiency</h3>
              <p className={styles.benefitDescription}>
                Save countless hours of manual review with automated anomaly detection that processes large datasets in minutes, 
                allowing your financial team to focus on analysis rather than data processing.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Data-Driven Insights</h3>
              <p className={styles.benefitDescription}>
                Generate actionable insights from your financial data with AI-powered analysis that highlights trends, 
                patterns, and potential areas of concern across your entire financial ecosystem.
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
              "Finaxial's anomaly detection system helped us identify SOX compliance issues in our quarterly reports before submission.
              The AI flagged several potential irregularities in our Excel files that our standard review process had overlooked, saving us from potential regulatory penalties."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <span className={styles.authorName}>Michael Chen</span>
              <span className={styles.authorTitle}>Compliance Director, Pacific Financial Group</span>
            </div>
            <div className={styles.caseStudyResults}>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>98%</span>
                <span className={styles.resultLabel}>Compliance Rate Achieved</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>85%</span>
                <span className={styles.resultLabel}>Reduction in Manual Reviews</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>12hrs</span>
                <span className={styles.resultLabel}>Time Saved Per Report</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to streamline your financial compliance checks?</h2>
          <p className={styles.ctaDescription}>
            Join organizations that use Finaxial to analyze financial data across multiple files and automatically detect compliance issues.
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
              <h3 className={styles.faqQuestion}>What file formats does the anomaly detection support?</h3>
              <p className={styles.faqAnswer}>
                Our system supports all common financial data formats including CSV, Excel (XLSX, XLS), PDF tables, and direct imports from 
                accounting systems. You can upload multiple files simultaneously for batch processing.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Which financial regulations does the system check for compliance?</h3>
              <p className={styles.faqAnswer}>
                Our system is designed to check for compliance with major financial standards including GAAP, IFRS, and Sarbanes-Oxley (SOX) 
                requirements. The system regularly updates its rule base to accommodate changing regulatory requirements.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How are detected anomalies reported to stakeholders?</h3>
              <p className={styles.faqAnswer}>
                The system automatically generates detailed reports of detected anomalies and can send them via email to designated 
                recipients with PDF attachments. Reports include visualizations, explanations of potential issues, and compliance impact assessments.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can the system process historical financial data?</h3>
              <p className={styles.faqAnswer}>
                Yes, our system can analyze historical financial data to establish baselines and detect past anomalies that may have been 
                missed. This is especially valuable for audit preparation, compliance reviews, and establishing data integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className={styles.seoSection}>
        <div className={styles.container}>
          <h2 className={styles.seoTitle}>Financial Compliance and Anomaly Detection Software</h2>
          <div className={styles.seoContent}>
            <p>
              Finaxial's AI-powered financial anomaly detection software helps businesses identify compliance issues, irregularities, 
              and potential errors in financial data across multiple CSV and Excel files. Our advanced machine learning algorithms analyze 
              your financial documents against GAAP, IFRS, and SOX requirements to ensure regulatory compliance.
            </p>
            <p>
              Key capabilities of our financial anomaly detection system include multi-file scanning, AI-powered analysis, 
              pattern recognition, and automated compliance verification. Organizations across industries rely on our system to 
              process large volumes of financial data efficiently and identify potential compliance issues before they become problems.
            </p>
            <p>
              Whether you're preparing for an audit, ensuring regulatory compliance, or simply looking to streamline your financial 
              data review process, Finaxial's anomaly detection system provides the intelligent analysis and reporting tools you need to 
              maintain financial data integrity while saving time and resources.
            </p>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
