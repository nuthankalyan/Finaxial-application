'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Onboarding } from '../components/Onboarding';
import { useAuth } from '../context/AuthContext';
import styles from './page.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if user is not authenticated
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className={styles.onboardingPage}>
      <Onboarding />
    </div>
  );
}
