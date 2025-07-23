'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './EmailReportModal.module.css';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: (emailData: EmailData) => Promise<void>;
  workspaceName?: string;
  fileName?: string;
  isLoading?: boolean;
}

interface EmailData {
  recipientEmail: string;
  recipientName: string;
  workspaceName: string;
  customMessage: string;
  exportFormat: 'pdf' | 'word' | 'xml';
}

const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  onSendEmail,
  workspaceName = 'Financial Analysis',
  fileName = 'financial-report.pdf',
  isLoading = false
}) => {
  const [formData, setFormData] = useState<EmailData>({
    recipientEmail: '',
    recipientName: '',
    workspaceName: workspaceName,
    customMessage: '',
    exportFormat: 'pdf'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for format dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Email address is required';
    } else if (!validateEmail(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      await onSendEmail(formData);
      setSuccessMessage('Report email sent successfully!');
      
      // Auto-close after success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send email. Please try again.');
    }
  };

  const handleClose = () => {
    setFormData({
      recipientEmail: '',
      recipientName: '',
      workspaceName: workspaceName,
      customMessage: '',
      exportFormat: 'pdf'
    });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    setShowFormatDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            Send Report via Email
          </h2>
          <p>Share your financial analysis report professionally</p>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="recipientEmail" className={styles.formLabel}>
                Recipient Email Address *
              </label>
              <input
                type="email"
                id="recipientEmail"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter email address"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.recipientEmail && (
                <div className={styles.errorMessage}>
                  ⚠️ {errors.recipientEmail}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="recipientName" className={styles.formLabel}>
                Recipient Name *
              </label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter recipient's name"
                disabled={isLoading}
                autoComplete="name"
              />
              {errors.recipientName && (
                <div className={styles.errorMessage}>
                  ⚠️ {errors.recipientName}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="workspaceName" className={styles.formLabel}>
                Workspace Name
              </label>
              <input
                type="text"
                id="workspaceName"
                name="workspaceName"
                value={formData.workspaceName}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter workspace name"
                disabled={isLoading}
              />
              <div className={styles.helpText}>
                This will appear in the email subject and content
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Export Format *
              </label>
              <div className={styles.formatSelector} ref={formatDropdownRef}>
                <button
                  type="button"
                  className={styles.formatButton}
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  disabled={isLoading}
                >
                  <span className={styles.formatButtonText}>
                    {formData.exportFormat === 'pdf' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        PDF Format
                      </>
                    )}
                    {formData.exportFormat === 'word' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <line x1="16" y1="9" x2="8" y2="9"></line>
                        </svg>
                        Word Document
                      </>
                    )}
                    {formData.exportFormat === 'xml' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
                          <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
                        </svg>
                        XML Format
                      </>
                    )}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`${styles.formatDropdownArrow} ${showFormatDropdown ? styles.formatDropdownArrowOpen : ''}`} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                {showFormatDropdown && (
                  <div className={styles.formatDropdownMenu}>
                    <button
                      type="button"
                      className={`${styles.formatDropdownItem} ${formData.exportFormat === 'pdf' ? styles.formatDropdownItemActive : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, exportFormat: 'pdf' }));
                        setShowFormatDropdown(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      PDF Format
                      <span className={styles.formatDescription}>Professional PDF with styling</span>
                    </button>
                    
                    <button
                      type="button"
                      className={`${styles.formatDropdownItem} ${formData.exportFormat === 'word' ? styles.formatDropdownItemActive : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, exportFormat: 'word' }));
                        setShowFormatDropdown(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="16" y1="9" x2="8" y2="9"></line>
                      </svg>
                      Word Document
                      <span className={styles.formatDescription}>Editable .docx format</span>
                    </button>
                    
                    <button
                      type="button"
                      className={`${styles.formatDropdownItem} ${formData.exportFormat === 'xml' ? styles.formatDropdownItemActive : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, exportFormat: 'xml' }));
                        setShowFormatDropdown(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={styles.formatIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
                        <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
                      </svg>
                      XML Format
                      <span className={styles.formatDescription}>Structured data format</span>
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.helpText}>
                Select the file format for your email attachment
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="customMessage" className={styles.formLabel}>
                Custom Message (Optional)
              </label>
              <textarea
                id="customMessage"
                name="customMessage"
                value={formData.customMessage}
                onChange={handleInputChange}
                className={styles.formTextarea}
                placeholder="Add a personal message to include with the report..."
                disabled={isLoading}
                rows={4}
              />
              <div className={styles.helpText}>
                Leave empty to use the default professional message
              </div>
            </div>

            <div className={styles.previewSection}>
              <h4>Email Preview</h4>
              <p><strong>To:</strong> {formData.recipientEmail || 'recipient@example.com'}</p>
              <p><strong>Subject:</strong>  {formData.workspaceName || 'Financial'} Analysis Report</p>
              <p><strong>Format:</strong> {formData.exportFormat.toUpperCase()} ({formData.exportFormat === 'pdf' ? 'Professional PDF with styling' : formData.exportFormat === 'word' ? 'Editable Word document' : 'Structured XML data'})</p>
              <p><strong>Attachment:</strong> <span className={styles.previewHighlight}>
                {fileName?.replace(/\.[^/.]+$/, '') || 'financial-report'}.{formData.exportFormat === 'word' ? 'docx' : formData.exportFormat}
              </span></p>
              <p><strong>Template:</strong> Professional FinAxial email template with branding</p>
            </div>

            {errorMessage && (
              <div className={styles.errorMessage}>
                ❌ {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className={styles.successMessage}>
                ✅ {successMessage}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.sendButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className={styles.loadingSpinner}></div>
                    Sending...
                  </>
                ) : (
                  <>
                     Send Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailReportModal;
