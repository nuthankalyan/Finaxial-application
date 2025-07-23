'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ComplianceRule {
  id: string;
  standard: 'GAAP' | 'IFRS' | 'SOX';
  category: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  requirement: string;
}

export interface ComplianceViolation {
  ruleId: string;
  rule: ComplianceRule;
  row: number;
  column: string;
  value: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  suggestion?: string;
}

export interface ComplianceCellHighlight {
  row: number;
  column: string;
  severity: 'critical' | 'warning' | 'info';
  violationType: string;
  description: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  violations: ComplianceViolation[];
  summary: string;
  recommendations: string[];
  executiveReport: string;
  // New fields for batch processing
  fileResults?: BatchComplianceFileResult[];
  aggregatedResult?: boolean;
}

export interface BatchComplianceFileResult {
  fileName: string;
  sheetName?: string;
  isCompliant: boolean;
  violations: ComplianceViolation[];
  checkCount: number;
  passedCount: number;
  failedCount: number;
}

export interface BatchComplianceInput {
  fileName: string;
  sheetName?: string;
  csvContent: string;
}

class ComplianceService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_2;
  }

  // Pre-defined compliance rules for common financial data validation
  private getStandardRules(): ComplianceRule[] {
    return [
      // GAAP Rules
      {
        id: 'gaap-revenue-recognition',
        standard: 'GAAP',
        category: 'Revenue Recognition',
        description: 'Revenue must be recognized when earned, not when cash is received',
        severity: 'critical',
        requirement: 'Revenue amounts must be positive and properly documented'
      },
      {
        id: 'gaap-matching-principle',
        standard: 'GAAP',
        category: 'Matching Principle',
        description: 'Expenses must be matched with related revenues in the same period',
        severity: 'critical',
        requirement: 'Expense and revenue periods must align'
      },
      {
        id: 'gaap-consistency',
        standard: 'GAAP',
        category: 'Consistency',
        description: 'Accounting methods must be applied consistently across periods',
        severity: 'warning',
        requirement: 'Account classifications and calculations must be consistent'
      },
      {
        id: 'gaap-materiality',
        standard: 'GAAP',
        category: 'Materiality',
        description: 'Material amounts must be disclosed separately',
        severity: 'warning',
        requirement: 'Significant items should be clearly identified and disclosed'
      },

      // IFRS Rules
      {
        id: 'ifrs-fair-value',
        standard: 'IFRS',
        category: 'Fair Value Measurement',
        description: 'Assets and liabilities measured at fair value must use appropriate valuation techniques',
        severity: 'critical',
        requirement: 'Fair value measurements must be reasonable and supportable'
      },
      {
        id: 'ifrs-substance-over-form',
        standard: 'IFRS',
        category: 'Substance Over Form',
        description: 'Transactions must be accounted for according to their substance',
        severity: 'critical',
        requirement: 'Economic substance must be reflected in accounting treatment'
      },
      {
        id: 'ifrs-completeness',
        standard: 'IFRS',
        category: 'Completeness',
        description: 'Financial statements must be complete within materiality constraints',
        severity: 'warning',
        requirement: 'All material transactions and events must be recorded'
      },
      {
        id: 'ifrs-comparability',
        standard: 'IFRS',
        category: 'Comparability',
        description: 'Information must be comparable across entities and time periods',
        severity: 'info',
        requirement: 'Consistent presentation and classification required'
      },

      // SOX Rules
      {
        id: 'sox-internal-controls',
        standard: 'SOX',
        category: 'Internal Controls',
        description: 'Adequate internal controls must be maintained over financial reporting',
        severity: 'critical',
        requirement: 'Data integrity and authorization controls must be evident'
      },
      {
        id: 'sox-accuracy',
        standard: 'SOX',
        category: 'Accuracy and Completeness',
        description: 'Financial data must be accurate and complete',
        severity: 'critical',
        requirement: 'No material misstatements or omissions allowed'
      },
      {
        id: 'sox-segregation',
        standard: 'SOX',
        category: 'Segregation of Duties',
        description: 'Proper segregation of duties must be maintained',
        severity: 'warning',
        requirement: 'Authorization, recording, and custody functions should be separated'
      },
      {
        id: 'sox-documentation',
        standard: 'SOX',
        category: 'Documentation',
        description: 'Adequate documentation must support all transactions',
        severity: 'warning',
        requirement: 'Supporting documentation and audit trails must be maintained'
      }
    ];
  }

  async validateCompliance(
    csvContent: string,
    fileName?: string
  ): Promise<ComplianceResult> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const standardRules = this.getStandardRules();

      const prompt = `
You are a financial compliance expert with deep knowledge of GAAP, IFRS, and SOX requirements. 
Analyze the following financial data for compliance violations and provide detailed findings.

FINANCIAL DATA:
${csvContent}

${fileName ? `FILE NAME: ${fileName}` : ''}

COMPLIANCE STANDARDS TO CHECK:
1. GAAP (Generally Accepted Accounting Principles)
2. IFRS (International Financial Reporting Standards)  
3. SOX (Sarbanes-Oxley Act)

ANALYSIS REQUIREMENTS:
Please perform a comprehensive compliance analysis and identify any violations or concerns related to:

GAAP Compliance:
- Revenue Recognition principles
- Matching principle adherence
- Consistency in accounting methods
- Materiality thresholds
- Proper classification of items
- Completeness of disclosures

IFRS Compliance:
- Fair value measurements
- Substance over form
- Completeness and accuracy
- Comparability across periods
- Proper presentation and disclosure

SOX Compliance:
- Data accuracy and completeness
- Internal control indicators
- Segregation of duties evidence
- Documentation adequacy
- Authorization and approval trails

SPECIFIC CHECKS TO PERFORM:
1. Data Integrity: Check for missing values, inconsistent formats, or suspicious entries
2. Mathematical Accuracy: Verify calculations and totals
3. Logical Consistency: Ensure relationships between accounts make sense
4. Period Consistency: Check for consistent treatment across time periods
5. Disclosure Adequacy: Assess if material items are properly identified
6. Control Evidence: Look for indicators of proper internal controls

FORMAT YOUR RESPONSE AS FOLLOWS:

EXECUTIVE_SUMMARY:
(Brief overview of compliance status and key findings)

COMPLIANCE_VIOLATIONS:
[
  {
    "ruleId": "rule-identifier",
    "standard": "GAAP|IFRS|SOX",
    "category": "Category Name",
    "severity": "critical|warning|info",
    "row": row_number_or_null,
    "column": "column_name_or_null",
    "value": "specific_value_or_null",
    "message": "Detailed description of the violation",
    "suggestion": "Recommended corrective action"
  }
]

COMPLIANCE_SUMMARY:
- Total Checks Performed: X
- Checks Passed: X  
- Checks Failed: X
- Critical Issues: X
- Warnings: X
- Information Items: X

KEY_RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
- Recommendation 3

AUDIT_READINESS_ASSESSMENT:
(Assessment of how audit-ready the data is and what needs to be addressed)
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response
      return this.parseComplianceResponse(text, standardRules);

    } catch (error: any) {
      console.error('Error validating compliance:', error);
      throw new Error(`Failed to validate compliance: ${error.message}`);
    }
  }

  private parseComplianceResponse(responseText: string, standardRules: ComplianceRule[]): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    let totalChecks = standardRules.length;
    let summary = '';
    let recommendations: string[] = [];
    let executiveReport = '';

    try {
      // Extract executive summary
      const summaryMatch = responseText.match(/EXECUTIVE_SUMMARY:([\s\S]*?)(?=COMPLIANCE_VIOLATIONS:|$)/i);
      if (summaryMatch) {
        executiveReport = summaryMatch[1].trim();
      }

      // Extract violations
      const violationsMatch = responseText.match(/COMPLIANCE_VIOLATIONS:([\s\S]*?)(?=COMPLIANCE_SUMMARY:|$)/i);
      if (violationsMatch) {
        try {
          const violationsJson = violationsMatch[1].trim();
          const jsonMatch = violationsJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            const parsedViolations = JSON.parse(jsonMatch[0]);
            
            parsedViolations.forEach((violation: any) => {
              // Find matching rule or create a generic one
              const rule = standardRules.find(r => r.id === violation.ruleId) || {
                id: violation.ruleId || 'unknown',
                standard: violation.standard || 'GAAP',
                category: violation.category || 'General',
                description: 'Compliance rule violation detected',
                severity: violation.severity || 'warning',
                requirement: 'Financial compliance requirement'
              } as ComplianceRule;

              violations.push({
                ruleId: violation.ruleId || 'unknown',
                rule,
                row: violation.row || -1,
                column: violation.column || '',
                value: violation.value || '',
                message: violation.message || 'Compliance violation detected',
                severity: violation.severity || 'warning',
                suggestion: violation.suggestion
              });
            });
          }
        } catch (parseError) {
          console.warn('Failed to parse violations JSON:', parseError);
        }
      }

      // Extract summary statistics
      const summaryStatsMatch = responseText.match(/COMPLIANCE_SUMMARY:([\s\S]*?)(?=KEY_RECOMMENDATIONS:|$)/i);
      if (summaryStatsMatch) {
        summary = summaryStatsMatch[1].trim();
        
        // Try to extract specific numbers
        const totalMatch = summary.match(/Total Checks Performed:\s*(\d+)/i);
        const passedMatch = summary.match(/Checks Passed:\s*(\d+)/i);
        const failedMatch = summary.match(/Checks Failed:\s*(\d+)/i);
        
        if (totalMatch) totalChecks = parseInt(totalMatch[1]);
      }

      // Extract recommendations
      const recommendationsMatch = responseText.match(/KEY_RECOMMENDATIONS:([\s\S]*?)(?=AUDIT_READINESS_ASSESSMENT:|$)/i);
      if (recommendationsMatch) {
        recommendations = recommendationsMatch[1]
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }

      // Calculate compliance metrics
      const failedChecks = violations.length;
      const passedChecks = Math.max(0, totalChecks - failedChecks);
      const isCompliant = failedChecks === 0;

      return {
        isCompliant,
        totalChecks,
        passedChecks,
        failedChecks,
        violations,
        summary: summary || 'Compliance analysis completed',
        recommendations: recommendations.length > 0 ? recommendations : ['Review identified issues and implement corrective measures'],
        executiveReport: executiveReport || 'Financial compliance analysis has been completed. Please review the detailed findings and recommendations.'
      };

    } catch (error) {
      console.error('Error parsing compliance response:', error);
      
      // Return a fallback result
      return {
        isCompliant: false,
        totalChecks: standardRules.length,
        passedChecks: 0,
        failedChecks: 1,
        violations: [{
          ruleId: 'parse-error',
          rule: {
            id: 'parse-error',
            standard: 'SOX',
            category: 'Data Quality',
            description: 'Error analyzing compliance data',
            severity: 'critical',
            requirement: 'Data must be analyzable for compliance'
          },
          row: -1,
          column: '',
          value: '',
          message: 'Unable to complete compliance analysis due to data format issues',
          severity: 'critical',
          suggestion: 'Ensure data is properly formatted and contains valid financial information'
        }],
        summary: 'Compliance analysis encountered errors',
        recommendations: ['Review data format and ensure it contains valid financial information'],
        executiveReport: 'Compliance analysis could not be completed due to data formatting issues. Please review the data structure and try again.'
      };
    }
  }

  // Method to validate compliance across multiple files and sheets
  async validateBatchCompliance(
    batchInputs: BatchComplianceInput[]
  ): Promise<ComplianceResult> {
    try {
      const fileResults: BatchComplianceFileResult[] = [];
      let totalChecks = 0;
      let totalPassed = 0;
      let totalFailed = 0;
      const allViolations: ComplianceViolation[] = [];
      const allRecommendations: string[] = [];

      // Process each file/sheet
      for (const input of batchInputs) {
        try {
          const result = await this.validateCompliance(input.csvContent, input.fileName);
          
          const fileResult: BatchComplianceFileResult = {
            fileName: input.fileName,
            sheetName: input.sheetName,
            isCompliant: result.isCompliant,
            violations: result.violations,
            checkCount: result.totalChecks,
            passedCount: result.passedChecks,
            failedCount: result.failedChecks
          };

          fileResults.push(fileResult);

          // Aggregate metrics
          totalChecks += result.totalChecks;
          totalPassed += result.passedChecks;
          totalFailed += result.failedChecks;

          // Collect all violations with file/sheet context
          result.violations.forEach(violation => {
            allViolations.push({
              ...violation,
              // Add file/sheet context to the message
              message: `[${input.fileName}${input.sheetName ? ` - ${input.sheetName}` : ''}] ${violation.message}`
            });
          });

          // Collect recommendations
          result.recommendations.forEach(rec => {
            if (!allRecommendations.includes(rec)) {
              allRecommendations.push(rec);
            }
          });

        } catch (error) {
          console.error(`Error processing ${input.fileName}:`, error);
          
          // Add error result for this file
          const errorResult: BatchComplianceFileResult = {
            fileName: input.fileName,
            sheetName: input.sheetName,
            isCompliant: false,
            violations: [{
              ruleId: 'file-error',
              rule: {
                id: 'file-error',
                standard: 'SOX',
                category: 'Data Processing',
                description: 'Error processing file for compliance',
                severity: 'critical',
                requirement: 'All files must be processable for compliance analysis'
              },
              row: -1,
              column: '',
              value: '',
              message: `[${input.fileName}${input.sheetName ? ` - ${input.sheetName}` : ''}] Unable to process file for compliance analysis`,
              severity: 'critical',
              suggestion: 'Check file format and data structure'
            }],
            checkCount: 1,
            passedCount: 0,
            failedCount: 1
          };

          fileResults.push(errorResult);
          totalFailed += 1;
          totalChecks += 1;
          allViolations.push(...errorResult.violations);
        }
      }

      // Generate aggregated summary
      const isCompliant = totalFailed === 0;
      const complianceRate = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
      
      const summary = `Batch Compliance Analysis Results:
- Files Processed: ${batchInputs.length}
- Total Compliance Checks: ${totalChecks}
- Checks Passed: ${totalPassed}
- Checks Failed: ${totalFailed}
- Overall Compliance Rate: ${complianceRate}%
- Files Compliant: ${fileResults.filter(f => f.isCompliant).length}/${fileResults.length}`;

      const executiveReport = `Multi-file compliance analysis has been completed across ${batchInputs.length} file(s). ${
        isCompliant 
          ? `All files passed compliance checks with a 100% compliance rate.`
          : `${totalFailed} compliance issues were identified across the analyzed files, resulting in a ${complianceRate}% compliance rate. Immediate attention is required for the identified violations.`
      }`;

      // Add batch-specific recommendations
      const batchRecommendations = [
        ...allRecommendations,
        'Review compliance issues across all files for consistency',
        'Implement standardized data entry procedures across all sources',
        'Consider automated compliance monitoring for ongoing validation'
      ];

      return {
        isCompliant,
        totalChecks,
        passedChecks: totalPassed,
        failedChecks: totalFailed,
        violations: allViolations,
        summary,
        recommendations: batchRecommendations,
        executiveReport,
        fileResults,
        aggregatedResult: true
      };

    } catch (error) {
      console.error('Error in batch compliance validation:', error);
      
      return {
        isCompliant: false,
        totalChecks: batchInputs.length,
        passedChecks: 0,
        failedChecks: batchInputs.length,
        violations: [{
          ruleId: 'batch-error',
          rule: {
            id: 'batch-error',
            standard: 'SOX',
            category: 'Batch Processing',
            description: 'Error in batch compliance processing',
            severity: 'critical',
            requirement: 'Batch processing must complete successfully'
          },
          row: -1,
          column: '',
          value: '',
          message: 'Unable to complete batch compliance analysis',
          severity: 'critical',
          suggestion: 'Review file formats and try processing files individually'
        }],
        summary: 'Batch compliance analysis encountered errors',
        recommendations: ['Review file formats and data structure', 'Try processing files individually'],
        executiveReport: 'Batch compliance analysis could not be completed due to processing errors.',
        fileResults: [],
        aggregatedResult: true
      };
    }
  }

  // Method to get compliance cell highlights for data table visualization
  getComplianceCellHighlights(violations: ComplianceViolation[]): ComplianceCellHighlight[] {
    return violations
      .filter(violation => violation.row > 0 && violation.column) // Only violations with specific cell locations
      .map(violation => ({
        row: violation.row - 1, // Convert to 0-based indexing for table display
        column: violation.column,
        severity: violation.severity,
        violationType: violation.rule.category,
        description: violation.message
      }));
  }

  // Method to export compliance report
  generateComplianceReport(result: ComplianceResult, fileName?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportTitle = `Financial Compliance Report - ${fileName || 'Data Analysis'}`;
    
    let report = `${reportTitle}\n`;
    report += `Generated on: ${timestamp}\n`;
    report += `${'='.repeat(reportTitle.length)}\n\n`;

    // Executive Summary
    report += `EXECUTIVE SUMMARY\n`;
    report += `-----------------\n`;
    report += `${result.executiveReport}\n\n`;

    // Compliance Status
    report += `COMPLIANCE STATUS\n`;
    report += `-----------------\n`;
    report += `Overall Status: ${result.isCompliant ? '✓ COMPLIANT' : '⚠ NON-COMPLIANT'}\n`;
    report += `Total Checks: ${result.totalChecks}\n`;
    report += `Passed: ${result.passedChecks}\n`;
    report += `Failed: ${result.failedChecks}\n\n`;

    // Violations
    if (result.violations.length > 0) {
      report += `COMPLIANCE VIOLATIONS\n`;
      report += `---------------------\n`;
      
      const criticalViolations = result.violations.filter((v: ComplianceViolation) => v.severity === 'critical');
      const warningViolations = result.violations.filter((v: ComplianceViolation) => v.severity === 'warning');
      const infoViolations = result.violations.filter((v: ComplianceViolation) => v.severity === 'info');

      if (criticalViolations.length > 0) {
        report += `\nCRITICAL ISSUES (${criticalViolations.length}):\n`;
        criticalViolations.forEach((violation: ComplianceViolation, index: number) => {
          report += `${index + 1}. [${violation.rule.standard}] ${violation.message}\n`;
          report += `   Category: ${violation.rule.category}\n`;
          if (violation.row > 0) report += `   Location: Row ${violation.row}, Column ${violation.column}\n`;
          if (violation.suggestion) report += `   Suggestion: ${violation.suggestion}\n`;
          report += `\n`;
        });
      }

      if (warningViolations.length > 0) {
        report += `\nWARNINGS (${warningViolations.length}):\n`;
        warningViolations.forEach((violation: ComplianceViolation, index: number) => {
          report += `${index + 1}. [${violation.rule.standard}] ${violation.message}\n`;
          report += `   Category: ${violation.rule.category}\n`;
          if (violation.row > 0) report += `   Location: Row ${violation.row}, Column ${violation.column}\n`;
          if (violation.suggestion) report += `   Suggestion: ${violation.suggestion}\n`;
          report += `\n`;
        });
      }

      if (infoViolations.length > 0) {
        report += `\nINFORMATION ITEMS (${infoViolations.length}):\n`;
        infoViolations.forEach((violation: ComplianceViolation, index: number) => {
          report += `${index + 1}. [${violation.rule.standard}] ${violation.message}\n`;
          report += `   Category: ${violation.rule.category}\n`;
          if (violation.row > 0) report += `   Location: Row ${violation.row}, Column ${violation.column}\n`;
          if (violation.suggestion) report += `   Suggestion: ${violation.suggestion}\n`;
          report += `\n`;
        });
      }
    } else {
      report += `COMPLIANCE VIOLATIONS\n`;
      report += `---------------------\n`;
      report += `No compliance violations detected.\n\n`;
    }

    // Recommendations
    report += `RECOMMENDATIONS\n`;
    report += `---------------\n`;
    result.recommendations.forEach((rec: string, index: number) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += `\n`;

    // Summary
    report += `SUMMARY\n`;
    report += `-------\n`;
    report += `${result.summary}\n\n`;

    report += `---\n`;
    report += `This report was generated automatically based on GAAP, IFRS, and SOX compliance standards.\n`;
    report += `Please review with a qualified financial professional for regulatory compliance.\n`;

    return report;
  }

  // Method to generate PDF compliance report
  generateCompliancePdfReport(result: ComplianceResult, fileName?: string): void {
    const doc = new jsPDF();
    const timestamp = new Date().toISOString().split('T')[0];
    const reportTitle = `Financial Compliance Report`;
    const subtitle = fileName ? `File: ${fileName}` : 'Data Analysis';
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.text(`Generated on: ${timestamp}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryText = result.executiveReport || 'No executive summary available.';
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 5 + 10;

    // Compliance Status
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance Status', margin, yPosition);
    yPosition += 10;

    // Status table
    const statusData = [
      ['Overall Status', result.isCompliant ? '✓ COMPLIANT' : '⚠ NON-COMPLIANT'],
      ['Total Checks', result.totalChecks.toString()],
      ['Passed', result.passedChecks.toString()],
      ['Failed', result.failedChecks.toString()]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: statusData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Violations section
    if (result.violations.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Compliance Violations', margin, yPosition);
      yPosition += 10;

      // Group violations by severity
      const criticalViolations = result.violations.filter(v => v.severity === 'critical');
      const warningViolations = result.violations.filter(v => v.severity === 'warning');
      const infoViolations = result.violations.filter(v => v.severity === 'info');

      // Critical violations
      if (criticalViolations.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red color
        doc.text(`Critical Issues (${criticalViolations.length})`, margin, yPosition);
        yPosition += 8;

        const criticalData = criticalViolations.map((violation, index) => [
          (index + 1).toString(),
          `[${violation.rule.standard}] ${violation.rule.category}`,
          violation.message,
          violation.row > 0 ? `Row ${violation.row}` : 'General',
          violation.suggestion || 'N/A'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Rule', 'Issue', 'Location', 'Suggestion']],
          body: criticalData,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 40 },
            2: { cellWidth: 60 },
            3: { cellWidth: 25 },
            4: { cellWidth: 50 }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      // Warning violations
      if (warningViolations.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(251, 191, 36); // Yellow color
        doc.text(`Warnings (${warningViolations.length})`, margin, yPosition);
        yPosition += 8;

        const warningData = warningViolations.map((violation, index) => [
          (index + 1).toString(),
          `[${violation.rule.standard}] ${violation.rule.category}`,
          violation.message,
          violation.row > 0 ? `Row ${violation.row}` : 'General',
          violation.suggestion || 'N/A'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Rule', 'Issue', 'Location', 'Suggestion']],
          body: warningData,
          theme: 'grid',
          headStyles: { fillColor: [251, 191, 36] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 40 },
            2: { cellWidth: 60 },
            3: { cellWidth: 25 },
            4: { cellWidth: 50 }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      // Info violations
      if (infoViolations.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); // Blue color
        doc.text(`Information Items (${infoViolations.length})`, margin, yPosition);
        yPosition += 8;

        const infoData = infoViolations.map((violation, index) => [
          (index + 1).toString(),
          `[${violation.rule.standard}] ${violation.rule.category}`,
          violation.message,
          violation.row > 0 ? `Row ${violation.row}` : 'General',
          violation.suggestion || 'N/A'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Rule', 'Issue', 'Location', 'Suggestion']],
          body: infoData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 40 },
            2: { cellWidth: 60 },
            3: { cellWidth: 25 },
            4: { cellWidth: 50 }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
    } else {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Compliance Violations', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 197, 94); // Green color
      doc.text('✓ No compliance violations detected.', margin, yPosition);
      yPosition += 15;
    }

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Check if we need a new page for recommendations
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', margin, yPosition);
      yPosition += 10;

      const recommendationData = result.recommendations.map((rec, index) => [
        (index + 1).toString(),
        rec
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Recommendation']],
        body: recommendationData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: contentWidth - 20 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page for summary
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    // Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryTextFinal = result.summary || 'No summary available.';
    const summaryLinesFinal = doc.splitTextToSize(summaryTextFinal, contentWidth);
    doc.text(summaryLinesFinal, margin, yPosition);
    yPosition += summaryLinesFinal.length * 5 + 15;

    // Footer disclaimer
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128); // Gray color
    const disclaimerText = 'This report was generated automatically based on GAAP, IFRS, and SOX compliance standards. Please review with a qualified financial professional for regulatory compliance.';
    const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
    doc.text(disclaimerLines, margin, yPosition);

    // Generate filename and save
    const dateStr = new Date().toISOString().split('T')[0];
    const fileNameSafe = fileName ? fileName.replace(/[^a-zA-Z0-9]/g, '_') : 'financial_data';
    const pdfFileName = `Compliance_Report_${fileNameSafe}_${dateStr}.pdf`;
    
    doc.save(pdfFileName);
  }
}

export const complianceService = new ComplianceService();
