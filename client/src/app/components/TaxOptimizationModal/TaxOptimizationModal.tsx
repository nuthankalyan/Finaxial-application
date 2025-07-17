'use client';
import { useState } from 'react';
import styles from './TaxOptimizationModal.module.css';
import { TaxOptimizationResult, TaxOptimizationSuggestion } from '../../services/taxOptimizationService';

interface TaxOptimizationModalProps {
  isOpen: boolean;
  result: TaxOptimizationResult | null;
  fileName?: string;
  onClose: () => void;
  onExportReport?: (report: string) => void;
}

export default function TaxOptimizationModal({
  isOpen,
  result, 
  fileName,
  onClose,
  onExportReport
}: TaxOptimizationModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'strategic' | 'compliance'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !result) return null;

  const filteredSuggestions = result.suggestions.filter(suggestion => {
    const categoryMatch = selectedCategory === 'all' || suggestion.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || suggestion.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#e53935">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'medium':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffb300">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'low':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#2196f3">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#9e9e9e">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'deduction':
        return '';
      case 'deferral':
        return '';
      case 'strategy':
        return '';
      case 'compliance':
        return '';
      default:
        return '';
    }
  };

  const handleExportReport = () => {
    if (!onExportReport) return;
    
    setIsExporting(true);
    try {
      const report = generateTaxOptimizationReport(result, fileName);
      onExportReport(report);
    } catch (error) {
      console.error('Error exporting tax optimization report:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateTaxOptimizationReport = (result: TaxOptimizationResult, fileName?: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportTitle = `Tax Optimization Report - ${fileName || 'Financial Analysis'}`;
    
    let report = `${reportTitle}\n`;
    report += `${'='.repeat(reportTitle.length)}\n\n`;
    report += `Generated on: ${timestamp}\n\n`;

    // Overview
    report += `EXECUTIVE OVERVIEW\n`;
    report += `-----------------\n`;
    report += `${result.overview}\n\n`;

    // Potential Savings
    report += `TOTAL POTENTIAL SAVINGS\n`;
    report += `----------------------\n`;
    report += `${result.totalPotentialSavings}\n\n`;

    // Suggestions
    report += `TAX OPTIMIZATION SUGGESTIONS\n`;
    report += `---------------------------\n`;
    result.suggestions.forEach((suggestion, index) => {
      report += `${index + 1}. ${suggestion.title} (${suggestion.priority.toUpperCase()} PRIORITY)\n`;
      report += `   Category: ${suggestion.category.toUpperCase()}\n`;
      report += `   Potential Savings: ${suggestion.potentialSavings}\n`;
      report += `   Description: ${suggestion.description}\n`;
      report += `   Implementation: ${suggestion.implementation}\n`;
      report += `   Timeframe: ${suggestion.timeframe}\n`;
      report += `   Applicable For: ${suggestion.applicableFor.join(', ')}\n\n`;
    });

    // Strategic Recommendations
    report += `STRATEGIC RECOMMENDATIONS\n`;
    report += `-----------------------\n`;
    result.strategicRecommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += `\n`;

    // Compliance Notes
    report += `COMPLIANCE CONSIDERATIONS\n`;
    report += `-----------------------\n`;
    result.complianceNotes.forEach((note, index) => {
      report += `${index + 1}. ${note}\n`;
    });
    report += `\n`;

    // Next Steps
    report += `NEXT STEPS\n`;
    report += `----------\n`;
    result.nextSteps.forEach((step, index) => {
      report += `${index + 1}. ${step}\n`;
    });
    report += `\n`;

    report += `---\n`;
    report += `This report was generated automatically using AI-powered financial analysis.\n`;
    report += `Please consult with a qualified tax professional before implementing any recommendations.\n`;

    return report;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.iconContainer}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M17,13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
              </svg>
            </div>
            <div>
              <h2 style={{ color: '#2563eb' }}>Tax Optimization Suggestions</h2>
              {fileName && <p className={styles.fileName}>Analysis for: {fileName}</p>}
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.exportButton} 
              onClick={handleExportReport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className={styles.spinner}></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Export Report
                </>
              )}
            </button>
            
            <button className={styles.closeButton} onClick={onClose} title="Close Tax Optimization Modal" aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Banner */}
        <div className={styles.summaryBanner}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{result.totalPotentialSavings}</div>
            <div className={styles.summaryLabel}>Potential Annual Savings</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{result.suggestions.length}</div>
            <div className={styles.summaryLabel}>Optimization Opportunities</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {result.suggestions.filter(s => s.priority === 'high').length}
            </div>
            <div className={styles.summaryLabel}>High Priority Items</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'suggestions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions ({result.suggestions.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'strategic' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('strategic')}
          >
            Strategic Planning
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'compliance' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            Compliance
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewContent}>
              <div className={styles.executiveSummary}>
                <h3>Executive Summary</h3>
                <p>{result.overview}</p>
              </div>
              
              <div className={styles.categoriesBreakdown}>
                <h3>Optimization Categories</h3>
                <div className={styles.categoriesGrid}>
                  <div className={styles.categoryCard}>
                    <div className={styles.categoryIcon}></div>
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryTitle}>Tax Deductions</div>
                      <div className={styles.categoryCount}>
                        {result.suggestions.filter(s => s.category === 'deduction').length} opportunities
                      </div>
                      <div className={styles.categoryDescription}>
                        Maximize allowable business deductions and credits
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.categoryCard}>
                    <div className={styles.categoryIcon}></div>
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryTitle}>Tax Deferrals</div>
                      <div className={styles.categoryCount}>
                        {result.suggestions.filter(s => s.category === 'deferral').length} opportunities
                      </div>
                      <div className={styles.categoryDescription}>
                        Strategic timing of income and expenses
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.categoryCard}>
                    <div className={styles.categoryIcon}></div>
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryTitle}>Strategic Planning</div>
                      <div className={styles.categoryCount}>
                        {result.suggestions.filter(s => s.category === 'strategy').length} opportunities
                      </div>
                      <div className={styles.categoryDescription}>
                        Long-term tax optimization strategies
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.categoryCard}>
                    <div className={styles.categoryIcon}></div>
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryTitle}>Compliance</div>
                      <div className={styles.categoryCount}>
                        {result.suggestions.filter(s => s.category === 'compliance').length} opportunities
                      </div>
                      <div className={styles.categoryDescription}>
                        Optimize filing processes and documentation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className={styles.suggestionsContent}>
              <div className={styles.filtersHeader}>
                <h3>Tax Optimization Suggestions</h3>
                <div className={styles.filters}>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.filter}
                    title="Filter by category"
                    aria-label="Filter suggestions by category"
                  >
                    <option value="all">All Categories</option>
                    <option value="deduction">Deductions</option>
                    <option value="deferral">Deferrals</option>
                    <option value="strategy">Strategy</option>
                    <option value="compliance">Compliance</option>
                  </select>
                  
                  <select 
                    value={selectedPriority} 
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className={styles.filter}
                    title="Filter by priority"
                    aria-label="Filter suggestions by priority"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.suggestionsList}>
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className={`${styles.suggestionCard} ${styles[`priority${suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}`]}`}>
                      <div className={styles.suggestionHeader}>
                        <div className={styles.suggestionMeta}>
                          <span className={styles.categoryBadge}>
                            {getCategoryIcon(suggestion.category)} {suggestion.category.toUpperCase()}
                          </span>
                          <span className={styles.priorityBadge}>
                            {getPriorityIcon(suggestion.priority)} {suggestion.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <div className={styles.savingsAmount}>{suggestion.potentialSavings}</div>
                      </div>
                      
                      <h4 className={styles.suggestionTitle}>{suggestion.title}</h4>
                      <p className={styles.suggestionDescription}>{suggestion.description}</p>
                      
                      <div className={styles.suggestionDetails}>
                        <div className={styles.detailSection}>
                          <strong>Implementation:</strong>
                          <p>{suggestion.implementation}</p>
                        </div>
                        
                        <div className={styles.detailSection}>
                          <strong>Timeframe:</strong>
                          <p>{suggestion.timeframe}</p>
                        </div>
                        
                        <div className={styles.detailSection}>
                          <strong>Applicable For:</strong>
                          <div className={styles.applicableTags}>
                            {suggestion.applicableFor.map((item, idx) => (
                              <span key={idx} className={styles.applicableTag}>{item}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    <p>No suggestions match the selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'strategic' && (
            <div className={styles.strategicContent}>
              <h3>Strategic Tax Planning</h3>
              <div className={styles.strategicList}>
                {result.strategicRecommendations.map((recommendation, index) => (
                  <div key={index} className={styles.strategicCard}>
                    <div className={styles.strategicNumber}>{index + 1}</div>
                    <div className={styles.strategicText}>{recommendation}</div>
                  </div>
                ))}
              </div>
              
              <div className={styles.nextStepsSection}>
                <h3>Immediate Next Steps</h3>
                <div className={styles.nextStepsList}>
                  {result.nextSteps.map((step, index) => (
                    <div key={index} className={styles.nextStepCard}>
                      <div className={styles.stepIcon}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                        </svg>
                      </div>
                      <div className={styles.stepText}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className={styles.complianceContent}>
              <h3>Compliance Considerations</h3>
              <div className={styles.complianceNotes}>
                {result.complianceNotes.map((note, index) => (
                  <div key={index} className={styles.complianceCard}>
                    <div className={styles.complianceIcon}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                      </svg>
                    </div>
                    <div className={styles.complianceText}>{note}</div>
                  </div>
                ))}
              </div>
              
              <div className={styles.disclaimer}>
                <div className={styles.disclaimerIcon}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
                  </svg>
                </div>
                <div>
                  <h4>Important Disclaimer</h4>
                  <p>
                    These suggestions are generated based on AI analysis of your financial data and are for informational purposes only. 
                    Tax laws vary by jurisdiction and individual circumstances. Always consult with a qualified tax professional before 
                    implementing any tax strategies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
