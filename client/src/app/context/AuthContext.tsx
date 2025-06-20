'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, buildApiUrl } from '../utils/apiConfig';

interface UserType {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  hasCompletedOnboarding?: boolean;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setInitialLoading(false);
          setLoading(false);
          return;
        }

        const response = await fetch(buildApiUrl('api/auth/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to authenticate');
        }

        setUser(data.data);
      } catch (err) {
        localStorage.removeItem('token');
        console.error('Failed to load user:', err);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };

    loadUserFromToken();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl('api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      
      // Fetch the full user profile
      const userResponse = await fetch(buildApiUrl('api/auth/me'), {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      
      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        throw new Error(userData.message || 'Failed to fetch user data');
      }
      
      setUser(userData.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl('api/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      
      // Set the user from the signup response
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        createdAt: new Date().toISOString(), // This will be updated when we fetch full profile
      });
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
    
    // Dispatch a storage event so other tabs can update
    window.dispatchEvent(new Event('storage'));
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        clearError
      }}
    >
      {!initialLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}