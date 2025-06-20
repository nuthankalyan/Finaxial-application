'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './signup.module.css';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Signup() {
  const router = useRouter();
  const { signup, error: authError, loading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });  const [error, setError] = useState('');

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
    
    return () => {
      // Clear any auth errors when component unmounts
      clearError();
    };
  }, [authError, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await signup(formData.username, formData.email, formData.password);
      // Redirect to onboarding after successful signup
      router.push('/onboarding');
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupForm}>
        <h1 className={styles.title}>Create a Finaxial Account</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className={styles.input}
            />
          </div>
            <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <PasswordInput
              value={formData.password}
              onChange={handleChange}
              name="password"
              placeholder="Create a password (min. 6 characters)"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={handleChange}
              name="confirmPassword"
              placeholder="Confirm your password"
              className={styles.input}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button} 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className={styles.links}>
          <p>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}