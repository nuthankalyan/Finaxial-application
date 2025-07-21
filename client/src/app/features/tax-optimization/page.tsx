'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import Header from '../../components/Header';
import ClientWrapper from '../../components/ClientWrapper';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import styles from "./page.module.css";

export default function TaxOptimization() {
  return (
    <main className={styles.page}>
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      
      {/* SEO-optimized headings */}
      <h1 className="sr-only">AI-Powered Tax Strategy Optimization Software | Finaxial</h1>
      
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.featureLabel}>TAX OPTIMIZATION</span>
            <h2 className={styles.heroTitle}>AI-Driven Tax Strategy & Planning</h2>
            <p className={styles.heroDescription}>
              Maximize tax savings with our intelligent tax optimization platform. Analyze complex financial data, 
              identify tax-saving opportunities, and implement strategic planning with AI-powered recommendations 
              tailored to your specific situation.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/signup" className={styles.primaryButton}>
                Start Free Trial
              </Link>
              <Link href="/contact" className={styles.secondaryButton}>
                Schedule Consultation
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image 
              src="/analytics-trends.svg"
              alt="Tax optimization platform showing tax savings opportunities"
              width={500}
              height={400}
            />
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Intelligent Tax Planning Features</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/ai-finance-assistant.svg"
                  alt="AI tax scenario analysis"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Tax Scenario Analysis</h3>
              <p className={styles.featureDescription}>
                Model multiple tax scenarios with our advanced simulation engine to identify the most 
                tax-efficient strategies for your business or personal finances.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/customizable-reports.svg"
                  alt="Deduction and credit identification"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Deduction & Credit Finder</h3>
              <p className={styles.featureDescription}>
                Our AI engine automatically identifies eligible deductions and credits based on your financial 
                data, ensuring you never miss valuable tax-saving opportunities.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/window.svg"
                  alt="Year-round tax planning dashboard"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Year-Round Tax Planning</h3>
              <p className={styles.featureDescription}>
                Move beyond tax-season scrambling with our proactive, year-round tax planning tools that 
                help you make tax-optimized business and investment decisions throughout the year.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Image
                  src="/globe.svg"
                  alt="International tax optimization"
                  width={56}
                  height={56}
                />
              </div>
              <h3 className={styles.featureTitle}>Multi-Jurisdiction Optimization</h3>
              <p className={styles.featureDescription}>
                Optimize tax strategies across multiple jurisdictions with our global tax database covering 
                federal, state, local, and international tax regulations for businesses with complex footprints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Section */}
      <section className={styles.strategySection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Strategic Tax Optimization Approach</h2>
          <div className={styles.strategyGrid}>
            <div className={styles.strategyCard}>
              <div className={styles.strategyHeader}>
                <span className={styles.strategyNumber}>1</span>
                <h3 className={styles.strategyTitle}>Financial Data Analysis</h3>
              </div>
              <p className={styles.strategyDescription}>
                Our platform analyzes your complete financial picture, including income sources, investments, 
                expenses, and business structures to establish a baseline for optimization opportunities.
              </p>
            </div>
            <div className={styles.strategyCard}>
              <div className={styles.strategyHeader}>
                <span className={styles.strategyNumber}>2</span>
                <h3 className={styles.strategyTitle}>Opportunity Identification</h3>
              </div>
              <p className={styles.strategyDescription}>
                Using AI and machine learning, we identify specific tax-saving opportunities based on your unique 
                financial situation, applicable regulations, and tax law changes.
              </p>
            </div>
            <div className={styles.strategyCard}>
              <div className={styles.strategyHeader}>
                <span className={styles.strategyNumber}>3</span>
                <h3 className={styles.strategyTitle}>Strategy Development</h3>
              </div>
              <p className={styles.strategyDescription}>
                Our system creates customized tax strategies aligned with your financial goals, risk tolerance, 
                and specific circumstances, complete with implementation guidelines.
              </p>
            </div>
            <div className={styles.strategyCard}>
              <div className={styles.strategyHeader}>
                <span className={styles.strategyNumber}>4</span>
                <h3 className={styles.strategyTitle}>Continuous Optimization</h3>
              </div>
              <p className={styles.strategyDescription}>
                We continuously monitor regulatory changes, financial performance, and new opportunities to 
                refine your tax strategy throughout the year for optimal results.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Benefits of AI Tax Optimization</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Maximize Tax Savings</h3>
              <p className={styles.benefitDescription}>
                Our customers save an average of 15-28% on their tax liabilities using our AI-powered tax 
                optimization strategies tailored to their specific situations.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Reduce Compliance Risk</h3>
              <p className={styles.benefitDescription}>
                Implement tax-efficient strategies that maximize savings while fully complying with all applicable 
                tax laws and regulations, reducing audit risk.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Strategic Decision Support</h3>
              <p className={styles.benefitDescription}>
                Make better business, investment, and financial planning decisions throughout the year with 
                tax implications clearly calculated and visualized.
              </p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Time & Resource Efficiency</h3>
              <p className={styles.benefitDescription}>
                Save valuable time and resources with automated tax analysis and planning that would typically 
                require dozens of hours from tax professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.caseStudySection}>
        <div className={styles.container}>
          <div className={styles.caseStudyContent}>
            <h2 className={styles.caseStudyTitle}>Success Story: Strategic Tax Savings</h2>
            <blockquote className={styles.testimonial}>
              "Finaxial's tax optimization platform identified tax planning opportunities we had missed for years. 
              By implementing their recommended strategies, we reduced our effective tax rate by 11.5% while maintaining 
              full compliance, resulting in over $340,000 in annual tax savings."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <span className={styles.authorName}>Emily Wong</span>
              <span className={styles.authorTitle}>CFO, Innovative Tech Solutions</span>
            </div>
            <div className={styles.caseStudyResults}>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>$340K+</span>
                <span className={styles.resultLabel}>Annual Tax Savings</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>11.5%</span>
                <span className={styles.resultLabel}>Tax Rate Reduction</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>100%</span>
                <span className={styles.resultLabel}>Compliance Maintained</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to optimize your tax strategy?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of businesses and individuals using Finaxial's AI-powered tax optimization platform to save money.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/signup" className={styles.primaryButton}>
              Start Free Trial
            </Link>
            <Link href="/contact" className={styles.outlineButton}>
              Get Tax Assessment
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How much can I expect to save with tax optimization?</h3>
              <p className={styles.faqAnswer}>
                Results vary based on your specific financial situation, but our clients typically save between 
                15-28% on their tax liabilities. Businesses with complex structures or international operations 
                often see the highest savings percentages.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Is AI tax optimization compliant with tax regulations?</h3>
              <p className={styles.faqAnswer}>
                Absolutely. Our platform focuses on legal tax avoidance strategies, not tax evasion. All 
                recommendations are based on current tax codes and regulations. Our system is regularly updated to 
                reflect tax law changes and maintains a clear distinction between legitimate planning and aggressive schemes.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How does the platform stay updated with changing tax laws?</h3>
              <p className={styles.faqAnswer}>
                Our tax database is continuously updated by our team of tax experts and automated monitoring systems 
                that track regulatory changes across jurisdictions. When tax laws change, our AI system immediately 
                adapts recommendations to ensure continued compliance and optimization.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can the platform integrate with my existing accounting software?</h3>
              <p className={styles.faqAnswer}>
                Yes, our tax optimization platform integrates seamlessly with popular accounting software including 
                QuickBooks, Xero, SAP, Oracle, and Microsoft Dynamics. We also offer secure API connections for 
                custom integrations with proprietary systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className={styles.seoSection}>
        <div className={styles.container}>
          <h2 className={styles.seoTitle}>Advanced AI Tax Strategy & Optimization Software</h2>
          <div className={styles.seoContent}>
            <p>
              Finaxial's AI-powered tax optimization software provides businesses and individuals with sophisticated 
              tax planning and strategy tools to legally minimize tax liabilities. Our platform analyzes your complete 
              financial picture to identify tax-saving opportunities that many traditional approaches miss.
            </p>
            <p>
              Key capabilities of our tax optimization platform include scenario analysis, deduction and credit identification, 
              year-round tax planning, and multi-jurisdiction optimization. Unlike generic tax software, our AI system creates 
              customized strategies aligned with your specific financial situation and goals.
            </p>
            <p>
              Whether you're a multinational corporation navigating complex international tax structures, a small business 
              seeking to maximize available incentives, or an individual with sophisticated investment portfolios, our tax 
              optimization platform provides the intelligent planning tools you need to minimize your tax burden while 
              maintaining full compliance.
            </p>
            <p>
              Tax strategy shouldn't be a once-a-year consideration. With Finaxial's continuous optimization approach, 
              you'll make tax-smart decisions throughout the year, supported by real-time analysis and forecasting that 
              shows the tax implications of business and investment choices before you make them.
            </p>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </main>
  );
}
