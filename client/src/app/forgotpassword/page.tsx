'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { buildApiUrl } from '../utils/apiConfig';

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOTP] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');    try {
      console.log('Sending forgot password request for email:', email);
      const response = await fetch(buildApiUrl('api/auth/forgotpassword'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setSuccess('OTP sent to your email address');
        setStep('otp');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {      const response = await fetch(buildApiUrl('api/auth/verifyotp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setStep('reset');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {      const response = await fetch(buildApiUrl('api/auth/resetpassword'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetToken, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password reset successful');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }
  };
  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return { title: 'Reset Password', subtitle: 'Enter your email to receive a reset code' };
      case 'otp':
        return { title: 'Enter OTP', subtitle: 'Enter the 6-digit code sent to your email' };
      case 'reset':
        return { title: 'New Password', subtitle: 'Create a new password for your account' };
    }
  };

  const { title, subtitle } = getStepTitle();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.stepIndicator}>
        <div className={`${styles.step} ${step === 'email' ? styles.stepActive : ''}`} />
        <div className={`${styles.step} ${step === 'otp' ? styles.stepActive : ''}`} />
        <div className={`${styles.step} ${step === 'reset' ? styles.stepActive : ''}`} />
      </div>

      {error && (
        <div className={styles.error}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className={styles.success}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleForgotPassword} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="Enter your email address"
            />
          </div>
          <button type="submit" className={styles.button}>
            Send Reset OTP
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="otp">Enter OTP</label>
            <input              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
              required
              maxLength={6}
              className={`${styles.input} ${styles.otpInput}`}
              placeholder="000000"
            />
          </div>
          <button type="submit" className={styles.button}>
            Verify OTP
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="password">New Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter new password"
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={styles.passwordToggleButton}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Confirm new password"
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className={styles.passwordToggleButton}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.button}>
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
