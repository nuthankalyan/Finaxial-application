import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CircleCheck } from 'lucide-react';
import styles from './Onboarding.module.css';
import { ProgressIndicator } from './ProgressIndicator';
import { buildApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome to Finaxial',
    description: 'Let\'s get started with setting up your financial workspace',
  },
  {
    id: 2,
    title: 'Personal Information',
    description: 'Tell us a bit about yourself to personalize your experience',
  },
  {
    id: 3,
    title: 'Company Information',
    description: 'Tell us about your company and role',
  }
];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  role: string;
  businessEmail: string;
}

interface FormErrors {
  [key: string]: string;
}

export const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    companyName: '',
    role: '',
    businessEmail: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateForm = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
    } else if (step === 2) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.role.trim()) {
        newErrors.role = 'Role is required';
      }
      if (!formData.businessEmail.trim()) {
        newErrors.businessEmail = 'Business email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
        newErrors.businessEmail = 'Please enter a valid business email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };  const handleNext = async () => {
    // For step 0 (Welcome), no validation needed
    if (currentStep === 0) {
      setCurrentStep(prev => prev + 1);
      return;
    }
      // Validate the current step
    if (validateForm(currentStep)) {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // On the final step, save the onboarding data
        const success = await saveOnboardingData();
        
        if (success) {
          // Redirect to dashboard when onboarding is complete and saved
          router.push('/dashboard');
        } else {
          // If there was an error saving the data, still try to redirect
          // to dashboard but log the error
          console.error('Failed to save onboarding data, redirecting anyway');
          router.push('/dashboard');
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveOnboardingData = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return false;
      }
      
      const response = await fetch(buildApiUrl('/api/auth/complete-onboarding'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          companyName: formData.companyName,
          role: formData.role,
          businessEmail: formData.businessEmail,
          onboardingCompleted: true
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to complete onboarding:', data);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className={styles.stepContent}>
            <h2>Welcome to Finaxial!</h2>
            <p>We're excited to help you take control of your finances. Let's get your account set up in just a few steps.</p>
          </div>
        );      case 1:
        return (
          <div className={styles.stepContent}>
            <h2>Personal Information</h2>
            <div className={styles.form}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="fullName">Full Name</label>
                <div className={styles.fieldInput}>                  
                  <input 
                    type="text" 
                    name="fullName"
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                    required
                    aria-label="Full Name"
                  />
                  {errors.fullName && (
                    <div className={styles.error}>{errors.fullName}</div>
                  )}
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="email">Email Address</label>
                <div className={styles.fieldInput}>
                  <input 
                    type="email" 
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    required
                    aria-label="Email Address"
                  />
                  {errors.email && (
                    <div className={styles.error}>{errors.email}</div>
                  )}
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="phone">Phone Number</label>
                <div className={styles.fieldInput}>
                  <input 
                    type="tel" 
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    required
                    aria-label="Phone Number"
                  />
                  {errors.phone && (
                    <div className={styles.error}>{errors.phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h2>Company Information</h2>
            <div className={styles.form}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="companyName">Company Name</label>
                <div className={styles.fieldInput}>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
                    required
                    aria-label="Company Name"
                  />
                  {errors.companyName && (
                    <div className={styles.error}>{errors.companyName}</div>
                  )}
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="role">Your Role</label>
                <div className={styles.fieldInput}>
                  <input
                    type="text"
                    name="role"
                    id="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.role ? styles.inputError : ''}`}
                    required
                    aria-label="Your Role"
                  />
                  {errors.role && (
                    <div className={styles.error}>{errors.role}</div>
                  )}
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="businessEmail">Business Email</label>
                <div className={styles.fieldInput}>
                  <input
                    type="email"
                    name="businessEmail"
                    id="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.businessEmail ? styles.inputError : ''}`}
                    required
                    aria-label="Business Email"
                  />
                  {errors.businessEmail && (
                    <div className={styles.error}>{errors.businessEmail}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        {renderStepContent()}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarContainer}>
            <ProgressIndicator steps={onboardingSteps} currentStep={currentStep} />
          </div>
        </div>
        <div className={styles.buttonContainer}>
          {currentStep > 0 && (
            <button onClick={handleBack} className={styles.backButton}>
              Back
            </button>
          )}          <motion.button
            onClick={handleNext}
            className={styles.nextButton}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            disabled={isSubmitting}
          >
            <div className={styles.buttonContent}>
              {isSubmitting ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  {currentStep === onboardingSteps.length - 1 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 15,
                        mass: 0.5,
                        bounce: 0.4
                      }}
                    >
                      <CircleCheck size={16} />
                    </motion.div>
                  )}
                  {currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Continue'}
                </>
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
