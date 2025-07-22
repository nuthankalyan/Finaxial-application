/**
 * Script to populate the knowledge base with financial data
 * 
 * Usage:
 * node populateKnowledgeBase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { generateEmbedding } = require('../services/ragService');
const KnowledgeItem = require('../models/KnowledgeItem');
const connectDB = require('../config/db');

// Sample financial knowledge to populate
const financialKnowledge = [
  {
    id: "gaap-accounting-standards",
    title: "GAAP Accounting Standards",
    content: `Generally Accepted Accounting Principles (GAAP) are a set of accounting standards, procedures, and rules companies must follow when creating their financial statements. The standards are developed by the Financial Accounting Standards Board (FASB).
    
Key GAAP principles include:
1. Revenue Recognition: Revenue should be recorded when it is realized and earned, not when the cash is received.
2. Matching Principle: Expenses should be recorded in the same period as the revenues they helped generate.
3. Full Disclosure: All relevant financial information should be disclosed in the financial statements.
4. Consistency: Once a company adopts an accounting method, it should use it consistently across reporting periods.
5. Going Concern: Financial statements are prepared assuming the company will continue to operate indefinitely.`,
    metadata: {
      source: "Financial Accounting Standards Board",
      category: "accounting-standards",
      region: "US",
      importance: "High",
      relevance: ["financial-reporting", "regulatory-compliance"]
    }
  },
  {
    id: "ifrs-accounting-standards",
    title: "IFRS Accounting Standards",
    content: `International Financial Reporting Standards (IFRS) are a set of accounting standards developed by the International Accounting Standards Board (IASB) that are becoming the global standard for the preparation of public company financial statements.
    
Key IFRS principles include:
1. Fair Value Measurement: Assets and liabilities are often measured at fair value.
2. Principles-Based Approach: IFRS provides general guidelines rather than specific rules.
3. Professional Judgment: Accountants must use professional judgment in applying the standards.
4. Substance Over Form: Transactions should be recorded based on their economic substance rather than their legal form.
5. Comprehensive Income: Includes all changes in equity during a period except for owner investments and distributions.`,
    metadata: {
      source: "International Accounting Standards Board",
      category: "accounting-standards",
      region: "International",
      importance: "High",
      relevance: ["financial-reporting", "regulatory-compliance"]
    }
  },
  {
    id: "financial-ratios",
    title: "Financial Ratios",
    content: `Financial ratios are mathematical comparisons of financial statement accounts or categories that can reveal insights about a company's financial health and performance.

Key financial ratios include:

Liquidity Ratios:
- Current Ratio = Current Assets / Current Liabilities
- Quick Ratio = (Cash + Cash Equivalents + Marketable Securities + Accounts Receivable) / Current Liabilities

Profitability Ratios:
- Gross Profit Margin = (Revenue - Cost of Goods Sold) / Revenue
- Net Profit Margin = Net Income / Revenue
- Return on Assets (ROA) = Net Income / Average Total Assets
- Return on Equity (ROE) = Net Income / Average Shareholders' Equity

Leverage Ratios:
- Debt-to-Equity Ratio = Total Debt / Total Equity
- Interest Coverage Ratio = EBIT / Interest Expense

Efficiency Ratios:
- Inventory Turnover = Cost of Goods Sold / Average Inventory
- Accounts Receivable Turnover = Net Credit Sales / Average Accounts Receivable
- Asset Turnover Ratio = Revenue / Average Total Assets`,
    metadata: {
      source: "Financial Analysis Handbook",
      category: "financial-reporting",
      region: "Global",
      importance: "High",
      relevance: ["anomaly-detection", "ai-analysis"]
    }
  },
  {
    id: "income-statement",
    title: "Income Statement",
    content: `An income statement is a financial statement that shows a company's revenues, expenses, and profits over a specific period of time. It provides information about a company's operations and financial performance.

Key components of an income statement include:

1. Revenue: The total amount of money generated from selling products or services.
2. Cost of Goods Sold (COGS): The direct costs attributable to the production of the goods sold by a company.
3. Gross Profit: Revenue minus COGS.
4. Operating Expenses: Expenses incurred in the normal course of business, such as salaries, rent, and utilities.
5. Operating Income: Gross profit minus operating expenses.
6. Interest Expense: The cost of borrowing money.
7. Income Before Taxes: Operating income minus interest expense.
8. Income Tax Expense: The amount of taxes a company must pay.
9. Net Income: The final profit or loss after all expenses have been deducted from revenue.

The income statement follows this basic formula: Net Income = Revenue - Expenses`,
    metadata: {
      source: "Financial Accounting Standards",
      category: "financial-reporting",
      region: "Global",
      importance: "High",
      relevance: ["data-transformation", "ai-analysis", "email-reports"]
    }
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    content: `A balance sheet is a financial statement that reports a company's assets, liabilities, and shareholders' equity at a specific point in time. It provides a snapshot of what a company owns and owes, as well as the amount invested by shareholders.

Key components of a balance sheet include:

1. Assets: Resources controlled by a company as a result of past events and from which future economic benefits are expected to flow to the entity.
   - Current Assets: Assets expected to be converted to cash within one year (e.g., cash, accounts receivable, inventory).
   - Non-Current Assets: Assets not expected to be converted to cash within one year (e.g., property, plant, equipment, long-term investments).

2. Liabilities: Present obligations arising from past events, the settlement of which is expected to result in an outflow of resources.
   - Current Liabilities: Obligations due within one year (e.g., accounts payable, short-term debt).
   - Non-Current Liabilities: Obligations due beyond one year (e.g., long-term debt, pension obligations).

3. Shareholders' Equity: The residual interest in the assets of an entity after deducting all its liabilities.
   - Share Capital: The amount invested by shareholders in a company.
   - Retained Earnings: The cumulative net income that has not been paid out as dividends.

The balance sheet follows this basic equation: Assets = Liabilities + Shareholders' Equity`,
    metadata: {
      source: "Financial Accounting Standards",
      category: "financial-reporting",
      region: "Global",
      importance: "High",
      relevance: ["data-transformation", "ai-analysis", "email-reports"]
    }
  },
  {
    id: "cash-flow-statement",
    title: "Cash Flow Statement",
    content: `A cash flow statement is a financial statement that summarizes the amount of cash and cash equivalents entering and leaving a company during a specified period. It helps assess a company's liquidity, solvency, and financial flexibility.

The cash flow statement is divided into three sections:

1. Operating Activities: Cash flows related to a company's main business operations.
   - Cash received from customers
   - Cash paid to suppliers and employees
   - Interest and taxes paid

2. Investing Activities: Cash flows related to the acquisition and disposal of long-term assets.
   - Purchase or sale of property, plant, and equipment
   - Purchase or sale of investments
   - Loans made to others

3. Financing Activities: Cash flows related to a company's financing activities.
   - Issuance or repurchase of shares
   - Borrowing or repayment of debt
   - Payment of dividends

Key calculations:
- Free Cash Flow = Operating Cash Flow - Capital Expenditures
- Cash Flow from Operations to Net Income Ratio = Cash Flow from Operations / Net Income

A healthy company generally has positive cash flow from operating activities, indicating that core operations are generating sufficient cash to maintain and grow the business.`,
    metadata: {
      source: "Financial Accounting Standards",
      category: "financial-reporting",
      region: "Global",
      importance: "High",
      relevance: ["anomaly-detection", "data-transformation", "ai-analysis"]
    }
  },
  {
    id: "sarbanes-oxley-act",
    title: "Sarbanes-Oxley Act",
    content: `The Sarbanes-Oxley Act (SOX) is a U.S. federal law enacted in 2002 in response to major corporate accounting scandals, including Enron and WorldCom. The act aims to protect investors by improving the accuracy and reliability of corporate disclosures.

Key provisions of the Sarbanes-Oxley Act:

1. Section 302: Corporate Responsibility for Financial Reports
   - CEOs and CFOs must personally certify the accuracy of financial statements
   - Officers are responsible for establishing and maintaining internal controls

2. Section 404: Management Assessment of Internal Controls
   - Management must assess and report on the effectiveness of internal controls
   - External auditors must attest to management's assessment

3. Section 802: Criminal Penalties for Altering Documents
   - Imposes criminal penalties for destroying, altering, or fabricating records
   - Extends the statute of limitations for securities fraud

4. Section 806: Whistleblower Protection
   - Provides protection for employees who report violations of securities laws
   - Prohibits retaliation against whistleblowers

5. Section 906: Corporate Responsibility for Financial Reports
   - Requires CEOs and CFOs to certify that financial statements comply with regulations
   - Imposes criminal penalties for knowingly certifying false financial statements

Compliance with SOX is mandatory for all publicly traded companies in the U.S., as well as wholly-owned subsidiaries and foreign companies that are publicly traded in the U.S.`,
    metadata: {
      source: "U.S. Securities and Exchange Commission",
      category: "regulatory-compliance",
      region: "US",
      importance: "High",
      relevance: ["financial-reporting", "anomaly-detection"]
    }
  },
  {
    id: "gdpr-financial-reporting",
    title: "GDPR Financial Reporting Requirements",
    content: `The General Data Protection Regulation (GDPR) is a European Union regulation that impacts how financial data is collected, processed, and reported. While primarily focused on data protection, it has significant implications for financial reporting and record-keeping.

Key GDPR requirements affecting financial reporting:

1. Personal Data Processing:
   - Financial reports containing personal data must be processed lawfully, fairly, and transparently
   - Data minimization principles apply to financial records with personal information

2. Data Subject Rights:
   - Individuals have the right to access their personal financial data
   - Right to request rectification of inaccurate financial information
   - Right to erasure ("right to be forgotten") applies to certain financial records

3. Data Security Requirements:
   - Financial data must be protected through appropriate technical and organizational measures
   - Data breach notification requirements apply to breaches involving financial information

4. Record-Keeping:
   - Organizations must maintain detailed records of data processing activities
   - Documentation of compliance with GDPR principles is required

5. Data Protection Impact Assessments:
   - Required for high-risk financial data processing activities
   - Must be conducted before implementing new financial reporting systems

Penalties for non-compliance can be severe, with fines up to €20 million or 4% of global annual revenue, whichever is higher.`,
    metadata: {
      source: "European Data Protection Board",
      category: "regulatory-compliance",
      region: "EU",
      importance: "High",
      relevance: ["financial-reporting", "email-reports", "data-transformation"]
    }
  },
  {
    id: "gasb-accounting-standards",
    title: "GASB Accounting Standards",
    content: `The Governmental Accounting Standards Board (GASB) establishes accounting and financial reporting standards for U.S. state and local governments. These standards are designed to enhance the understandability and usefulness of governmental financial reports.

Key GASB principles include:

1. Fund Accounting: Resources are divided into separate funds based on their intended use and legal restrictions.

2. Modified Accrual Basis: Many governmental funds use a modified accrual basis, recognizing revenues when they become available and measurable and expenditures when liabilities are incurred.

3. Government-Wide Financial Reporting: Requires government-wide financial statements using full accrual accounting, in addition to fund financial statements.

4. Management's Discussion and Analysis (MD&A): Requires a narrative overview and analysis of financial activities.

5. Budget Comparison Reporting: Original and final budget amounts must be presented alongside actual results for the general fund and major special revenue funds.

Notable GASB Statements:
- GASB 34: Basic Financial Statements for State and Local Governments
- GASB 54: Fund Balance Reporting
- GASB 68: Accounting and Financial Reporting for Pensions
- GASB 75: Accounting and Financial Reporting for Postemployment Benefits Other Than Pensions
- GASB 87: Leases`,
    metadata: {
      source: "Governmental Accounting Standards Board",
      category: "accounting-standards",
      region: "US",
      importance: "Medium",
      relevance: ["financial-reporting", "regulatory-compliance"]
    }
  },
  {
    id: "financial-statement-fraud-red-flags",
    title: "Financial Statement Fraud Red Flags",
    content: `Financial statement fraud involves intentionally misstating financial information to deceive users. Being aware of potential red flags can help identify fraudulent reporting practices.

Common red flags of financial statement fraud:

1. Accounting Anomalies:
   - Unexplained changes in accounting policies or estimates
   - Aggressive revenue recognition practices
   - Frequent adjustments to reserves and allowances
   - Transactions recorded at unusual times (e.g., end of reporting period)
   - Improper capitalization of expenses

2. Financial Performance Patterns:
   - Revenue growth inconsistent with industry trends or economic conditions
   - Profits increasing while operating cash flows decline
   - Unusual profitability compared to industry peers
   - Significant, unexplained fluctuations in financial ratios

3. Corporate Governance Issues:
   - Dominant management with little oversight
   - Frequent changes in external auditors
   - Complex organizational structure without clear business purpose
   - Related party transactions lacking transparency
   - Restricted auditor access to information or personnel

4. Business Environment Factors:
   - High pressure to meet analyst expectations
   - Excessive focus on short-term results
   - Rapid growth in a competitive or saturated market
   - Compensation heavily tied to financial performance metrics

5. Disclosure and Transparency Concerns:
   - Vague or minimal disclosures about critical accounting policies
   - Delays in financial reporting or filing extensions
   - Reluctance to provide requested information
   - Inconsistencies between MD&A and financial statements

Detecting these warning signs requires professional skepticism and thorough analysis of both financial and non-financial information.`,
    metadata: {
      source: "Association of Certified Fraud Examiners",
      category: "regulatory-compliance",
      region: "Global",
      importance: "High",
      relevance: ["anomaly-detection", "ai-analysis", "financial-reporting"]
    }
  }
];

/**
 * Populates the knowledge base with financial data
 */
async function populateKnowledgeBase() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to database');

    // Clear existing knowledge items
    await KnowledgeItem.deleteMany({});
    console.log('Cleared existing knowledge items');

    // Process items in batches
    const batchSize = 3; // Process 3 items at a time
    const delayBetweenBatches = 2000; // 2 second delay between batches
    
    console.log('Adding knowledge items in batches...');
    
    for (let i = 0; i < financialKnowledge.length; i += batchSize) {
      const batch = financialKnowledge.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(financialKnowledge.length/batchSize)}`);
      
      for (const item of batch) {
        try {
          // Generate embedding for the content
          const embedding = await generateEmbedding(item.content);
          
          // Create knowledge item
          await KnowledgeItem.create({
            id: item.id,
            title: item.title,
            content: item.content,
            embedding: embedding,
            metadata: item.metadata
          });
          
          console.log(`✅ Added: ${item.title}`);
        } catch (error) {
          console.error(`❌ Failed to add ${item.title}:`, error.message);
        }
      }
      
      console.log(`Completed batch. Processed ${Math.min(i + batchSize, financialKnowledge.length)} of ${financialKnowledge.length} items`);
      
      // Add delay between batches unless it's the last batch
      if (i + batchSize < financialKnowledge.length) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log('Knowledge base population complete!');
    console.log(`${financialKnowledge.length} items added to the knowledge base`);
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error populating knowledge base:', error);
    process.exit(1);
  }
}

// Execute the population function
populateKnowledgeBase();
