import React from 'react';
import { motion } from 'framer-motion';
import { CircleCheck } from 'lucide-react';
import styles from './ProgressIndicator.module.css';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
}) => {
  const getProgressWidth = () => {
    switch(currentStep) {
      case 0:
        return '24px';
      case 1:
        return '60px';
      case 2:
        return '96px';
      default:
        return '24px';
    }
  };

  return (
    <div className={styles.progressContainer}>
      <div className={styles.stepsInfo}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.stepInfo} ${
              currentStep >= index ? styles.active : ''
            } ${currentStep > index ? styles.completed : ''}`}
          >
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>

      <div className={styles.dotsContainer}>
        {steps.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${
              index <= currentStep ? styles.activeDot : styles.inactiveDot
            }`}
          />
        ))}

        <motion.div
          initial={{ width: '24px' }}
          animate={{
            width: getProgressWidth(),
          }}
          className={styles.progressOverlay}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            mass: 0.8,
            bounce: 0.25,
            duration: 0.6
          }}
        />
      </div>
    </div>
  );
};
