'use client';

import React, { useState } from 'react';
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
    customMessage: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
      customMessage: ''
    });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
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
              <p><strong>Attachment:</strong> <span className={styles.previewHighlight}>{fileName}</span></p>
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
