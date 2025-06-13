'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const router = useRouter();
  const { login, error: authError, loading, clearError } = useAuth();  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

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
    await login(formData.username, formData.password);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginForm}>
        <h1 className={styles.title}>Log in to Finaxial</h1>
        
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
              placeholder="Enter your username"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">
              Password
              <Link href="/forgotpassword" className={styles.forgotPasswordLink}>
                Forgot password?
              </Link>
            </label>            <PasswordInput
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={styles.input}
              name="password"
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button} 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className={styles.links}>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}