'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from '../../components/Header';
import ClientWrapper from '../../components/ClientWrapper';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import styles from "./page.module.css";

export default function ComplianceAutomation() {
  return (
    <main className={styles.page}>
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      
      {/* SEO-optimized headings */}
      <h1 className="sr-only">Regulatory Compliance Automation Software | Finaxial</h1>
      
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.featureLabel}>COMPLIANCE AUTOMATION</span>
            <h2 className={styles.heroTitle}>AI-Powered Financial Compliance Checks</h2>
            <p className={styles.heroDescription}>
              Automatically validate your financial data against GAAP, IFRS, and SOX compliance standards with our 
              intelligent compliance system. Process multiple CSV and Excel files simultaneously, receive detailed 
              compliance reports, and get actionable recommendations to address any violations.
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
              src="/template-reports.svg"
              alt="Regulatory compliance automation dashboard showing compliance status"
              width={500}
              height={400}
            />
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Key Compliance Capabilities</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/analytics-trends.svg"
                  alt="Automated compliance monitoring dashboard"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Continuous Compliance Monitoring</h3>
              <p className={styles.featureDescription}>
                Our platform continuously monitors transactions, data flows, and processes to ensure 
                ongoing compliance, with real-time alerts for potential violations before they become issues.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/customizable-reports.svg"
                  alt="Regulatory reporting templates"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Batch Compliance Checking</h3>
              <p className={styles.featureDescription}>
                Process multiple CSV and Excel files simultaneously with our batch compliance checker. Analyze all sheets 
                at once against GAAP, IFRS, and SOX standards with a single click.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/window.svg"
                  alt="Regulatory change management notification"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Cell-Level Violation Highlighting</h3>
              <p className={styles.featureDescription}>
                Identify compliance issues with visual indicators and color-coded severity highlighting. Critical issues, 
                warnings, and informational items are clearly marked with tooltips showing detailed violation information.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/file.svg"
                  alt="Compliance documentation and audit trail"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Professional PDF Compliance Reports</h3>
              <p className={styles.featureDescription}>
                Generate and export professional compliance reports as PDF files with executive summaries, detailed violation 
                listings, recommendations for fixing issues, and compliance statistics in a well-structured format.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Framework Section */}
      <section className={styles.regulatorySection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Supported Regulatory Frameworks</h2>
          <div className={styles.regulatoryGrid}>
            <div className={styles.regulatoryCard}>
              <h3 className={styles.regulatoryTitle}>
                Financial Regulations
                <span className={styles.regulatoryBadge}>Global</span>
              </h3>
              <p className={styles.regulatoryDescription}>
                Comprehensive coverage for SOX, Dodd-Frank, Basel III, MiFID II, PSD2, and AML/KYC regulations 
                with automated controls, monitoring, and reporting capabilities.
              </p>
            </div>
            <div className={styles.regulatoryCard}>
              <h3 className={styles.regulatoryTitle}>
                Data Privacy
                <span className={styles.regulatoryBadge}>Regional</span>
              </h3>
              <p className={styles.regulatoryDescription}>
                End-to-end compliance automation for GDPR, CCPA, PIPEDA, and other privacy regulations, 
                including data mapping, subject rights management, and breach reporting.
              </p>
            </div>
            <div className={styles.regulatoryCard}>
              <h3 className={styles.regulatoryTitle}>
                Industry-Specific
                <span className={styles.regulatoryBadge}>Specialized</span>
              </h3>
              <p className={styles.regulatoryDescription}>
                Tailored compliance solutions for HIPAA (healthcare), PCI-DSS (payment card), NERC (energy), 
                and other industry-specific regulatory requirements.
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
              <h3 className={styles.benefitTitle}>Risk Reduction</h3>
              <p className={styles.benefitDescription}>
                Minimize compliance risks with proactive monitoring and controls that identify potential issues 
                before they result in violations or penalties.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Cost Efficiency</h3>
              <p className={styles.benefitDescription}>
                Reduce compliance costs by up to 70% through automation of manual processes, documentation, 
                and reporting tasks that traditionally consume significant resources.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Operational Excellence</h3>
              <p className={styles.benefitDescription}>
                Transform compliance from a cost center to a value driver by streamlining processes, 
                reducing errors, and enabling a more agile response to regulatory changes.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Business Confidence</h3>
              <p className={styles.benefitDescription}>
                Gain peace of mind with a comprehensive compliance program that meets regulatory requirements 
                while supporting business growth and innovation.
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
              "Implementing Finaxial's compliance automation solution reduced our regulatory reporting time by 85% 
              and eliminated compliance penalties completely. The system automatically adapts to regulatory changes, 
              giving us confidence that we're always in compliance."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <span className={styles.authorName}>Michael Patel</span>
              <span className={styles.authorTitle}>Chief Compliance Officer, Global Financial Services</span>
            </div>
            <div className={styles.caseStudyResults}>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>85%</span>
                <span className={styles.resultLabel}>Reduction in Compliance Hours</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>100%</span>
                <span className={styles.resultLabel}>Audit Pass Rate</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>$1.8M</span>
                <span className={styles.resultLabel}>Annual Cost Savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to automate your compliance processes?</h2>
          <p className={styles.ctaDescription}>
            Join hundreds of organizations using Finaxial's AI-powered compliance automation to reduce risk and costs.
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
              <h3 className={styles.faqQuestion}>How quickly can we implement compliance automation?</h3>
              <p className={styles.faqAnswer}>
                Most customers can implement our compliance automation solution within 4-6 weeks. We provide 
                pre-built configurations for major regulatory frameworks, significantly accelerating deployment 
                compared to traditional compliance solutions.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can the system adapt to our specific industry regulations?</h3>
              <p className={styles.faqAnswer}>
                Yes, our platform is designed to be highly configurable and supports industry-specific regulations 
                across financial services, healthcare, energy, retail, and other sectors. We regularly update our 
                regulatory content library to ensure coverage of the latest requirements.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How does the system handle cross-border compliance requirements?</h3>
              <p className={styles.faqAnswer}>
                Our solution includes jurisdiction mapping capabilities that identify applicable regulations based on 
                your operational footprint. The system automatically applies the appropriate rules and controls for 
                each jurisdiction where you operate, simplifying global compliance management.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What security measures are in place to protect compliance data?</h3>
              <p className={styles.faqAnswer}>
                Our platform employs enterprise-grade security including end-to-end encryption, role-based access controls, 
                secure cloud infrastructure, and regular security audits. We maintain SOC 2 Type II certification and comply 
                with major data protection regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className={styles.seoSection}>
        <div className={styles.container}>
          <h2 className={styles.seoTitle}>Regulatory Compliance Automation Software</h2>
          <div className={styles.seoContent}>
            <p>
              Finaxial's regulatory compliance automation software provides businesses with powerful tools to streamline and 
              automate compliance processes across multiple regulatory frameworks. Our intelligent platform transforms how 
              organizations approach compliance management, moving from manual, reactive processes to automated, proactive compliance.
            </p>
            <p>
              Key capabilities include continuous compliance monitoring, automated regulatory reporting, regulatory change 
              management, and audit-ready documentation. Organizations across industries rely on our compliance automation to 
              reduce risk, cut costs, and maintain consistent adherence to complex regulations.
            </p>
            <p>
              With support for major regulatory frameworks including GDPR, HIPAA, SOX, PCI-DSS, AML/KYC, and industry-specific 
              regulations, Finaxial provides comprehensive coverage for your compliance needs. Our AI-powered system continuously 
              adapts to regulatory changes, ensuring your compliance program remains current without requiring constant manual updates.
            </p>
            <p>
              Whether you're looking to streamline financial compliance, enhance data privacy controls, or automate industry-specific 
              regulatory requirements, Finaxial's compliance automation platform provides the intelligent, adaptable solution you need 
              to navigate today's complex regulatory landscape.
            </p>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
