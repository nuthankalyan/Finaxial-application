import React from 'react';
import styles from './DescriptionPopup.module.css';

interface DescriptionPopupProps {
  description: string;
  onClose: () => void;
  isOpen: boolean;
}

const DescriptionPopup: React.FC<DescriptionPopupProps> = ({
  description,
  onClose,
  isOpen
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.popup}>
        <div className={styles.header}>
          <h3>Workspace Description</h3>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          {description || 'No description provided'}
        </div>
      </div>
    </>
  );
};

export default DescriptionPopup;
