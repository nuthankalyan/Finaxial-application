'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function Login() {
  const router = useRouter();
  const { login, error: authError, loading, clearError } = useAuth();  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
<<<<<<< HEAD
=======
  const [showForgotPassword, setShowForgotPassword] = useState(false);
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087

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

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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
            <label htmlFor="password">Password</label>
<<<<<<< HEAD
            <div className={styles.passwordGroup}>
=======
            <div className={styles.passwordInputWrapper}>
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className={styles.input}
              />
              <button
                type="button"
<<<<<<< HEAD
                className={styles.showPasswordButton}
                onClick={() => setShowPassword(!showPassword)}
=======
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
<<<<<<< HEAD
=======
          </div>

          <div className={styles.forgotPasswordLink}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className={styles.linkButton}
            >
              Forgot Password?
            </button>
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087
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
          <p>
            Forgot your password?{' '}
            <Link href="/forgot-password" className={styles.link}>
              Reset it here
            </Link>
          </p>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}