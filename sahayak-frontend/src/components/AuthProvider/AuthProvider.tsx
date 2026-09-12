"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export type Role = 'elderly' | 'caregiver' | 'family' | 'healthcare' | 'admin';

export type SessionUser = {
  id: string;
  email: string;
  profileId: string;
  role: Role;
};

export type Session = {
  user: SessionUser | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
};

interface AuthContextType {
  session: Session;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session>({
    user: null,
    status: 'loading',
  });

  useEffect(() => {
    const fetchSession = async () => {
      const tokenStr = localStorage.getItem('sahayak_token');
      if (!tokenStr) {
        setSession({ user: null, status: 'unauthenticated' });
        document.cookie = 'sahayak_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return;
      }

      // Sync fake cookie (optional, edge middleware is disabled)
      document.cookie = `sahayak_session=${tokenStr}; path=/; max-age=604800; SameSite=Lax`;

      try {
        const data = await apiClient('/api/auth/me');
        if (data.user) {
          setSession({ user: data.user, status: 'authenticated' });
        } else {
          // If the backend explicitly says no user, they might be logged out
          setSession({ user: null, status: 'unauthenticated' });
        }
      } catch (error) {
        // If the backend fails (502 or timeout), DO NOT clear the token! 
        // Just set unauthenticated so the UI loads but doesn't forcefully redirect.
        setSession({ user: null, status: 'unauthenticated' });
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    // Protect routes
    const publicPaths = ['/login', '/register', '/forgot-password'];
    
    if (session.status === 'unauthenticated' && !publicPaths.includes(pathname)) {
      // In demo mode, we won't aggressively redirect to login if the session is unauthenticated.
      // We will let the user stay on the page (though data might not load).
      // If you still want it to redirect on genuine fresh loads, keep this, but the user requested removal.
      // router.push('/login');
      // return;
    }

    // Role-based protection
    if (session.status === 'authenticated' && session.user) {
      const role = session.user.role;
      
      if (pathname === '/' && role !== 'elderly') {
        if (role === 'family') router.replace('/family');
        if (role === 'caregiver') router.replace('/caregiver');
        if (role === 'healthcare') router.replace('/healthcare');
        if (role === 'admin') router.replace('/admin');
        return;
      }
    }
  }, [session.status, pathname, router, session.user]);

  const login = async (credentials: any) => {
    try {
      // We must call the real API to get a valid JWT token so that AI features and backend data work!
      const data = await apiClient('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (data.token) {
        localStorage.setItem('sahayak_token', data.token);
        document.cookie = `sahayak_session=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      setSession({ user: data.user, status: 'authenticated' });
      
      // Route appropriately
      if (data.user.role === 'elderly') router.push('/');
      else if (data.user.role === 'caregiver') router.push('/caregiver');
      else if (data.user.role === 'family') router.push('/family');
      else if (data.user.role === 'healthcare') router.push('/healthcare');
      else if (data.user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const data = await apiClient('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (data.token) {
        localStorage.setItem('sahayak_token', data.token);
        document.cookie = `sahayak_session=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      setSession({ user: data.user, status: 'authenticated' });
      if (data.user.role === 'elderly') router.push('/');
      else if (data.user.role === 'caregiver') router.push('/caregiver');
      else if (data.user.role === 'family') router.push('/family');
      else if (data.user.role === 'healthcare') router.push('/healthcare');
      else if (data.user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('sahayak_token');
      document.cookie = 'sahayak_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setSession({ user: null, status: 'unauthenticated' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
