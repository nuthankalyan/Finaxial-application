"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const headerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check on mount
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header 
      ref={headerRef}
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}
    >
      <div className={styles.container}>
        <div className={styles.flexContainer}>
          {/* Logo/Brand - Left Side */}
          <div className={styles.logoContainer}>
            <Link href="/">
              <h1 className={styles.logoText}>Finaxial</h1>
            </Link>
          </div>
          
          {/* Nav Links - Center */}
         
          {/* Auth Buttons - Right Side */}
          <div className={styles.authContainer}>
            {user ? (
              <div className={styles.authButtons}>
                <Link href="/dashboard" className={`${styles.loginButton} ${styles.fadeInDelay100}`}>Dashboard</Link>
                <div className={styles.authButtonItem}>
                  <button onClick={logout} className={`${styles.signupButton} ${styles.fadeInDelay200}`}>Logout</button>
                </div>
                <ThemeToggle className={styles.themeToggleButton} />
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link href="/login" className={`${styles.loginButton} ${styles.fadeInDelay100}`}>Login</Link>
                <div className={styles.authButtonItem}>
                  <Link href="/signup" className={`${styles.signupButton} ${styles.fadeInDelay200}`}>Sign Up</Link>
                </div>
                <ThemeToggle className={styles.themeToggleButton} />
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              className={styles.menuToggle} 
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            <nav className={styles.mobileNavList}>
              <div className={styles.mobileNavItem}>
                <a href="#features" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Features</a>
              </div>
              <div className={styles.mobileNavItem}>
                <a href="#testimonials" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Testimonials</a>
              </div>
              <div className={styles.mobileNavItem}>
                <a href="#pricing" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Pricing</a>
              </div>
              <div className={styles.mobileNavItem}>
                <a href="#contact" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Contact</a>
              </div>
              {user ? (
                <>
                  <div className={styles.mobileNavItem}>
                    <Link href="/dashboard" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  </div>
                  <div className={styles.mobileNavItem}>
                    <button onClick={logout} className={styles.navLink}>Logout</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.mobileNavItem}>
                    <Link href="/login" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </div>
                  <div className={styles.mobileNavItem}>
                    <Link href="/signup" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                  </div>
                </>
              )}
              <div className={styles.mobileNavItem}>
                <div className={styles.mobileThemeToggle}>
                  <ThemeToggle />
                  <span>Toggle theme</span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 