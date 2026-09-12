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

      // Sync fake cookie
      document.cookie = `sahayak_session=simulated-token; path=/; max-age=604800; SameSite=Lax`;

      try {
        // In Demo Mode, the token in localStorage is just the stringified user object
        const mockUser = JSON.parse(tokenStr);
        setSession({ user: mockUser, status: 'authenticated' });
      } catch (error) {
        setSession({ user: null, status: 'unauthenticated' });
        localStorage.removeItem('sahayak_token');
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
      // Demo Mode: Bypass backend /api/auth/login completely
      const mockUser = {
        id: 'simulated-id',
        email: credentials.email || 'demo@example.com',
        profileId: 'simulated-profile',
        role: credentials.role || 'elderly'
      };

      // Store the mock user object as the token in localStorage
      localStorage.setItem('sahayak_token', JSON.stringify(mockUser));
      document.cookie = `sahayak_session=simulated-token; path=/; max-age=604800; SameSite=Lax`;

      setSession({ user: mockUser, status: 'authenticated' });
      
      // Route appropriately
      if (mockUser.role === 'elderly') router.push('/');
      else if (mockUser.role === 'caregiver') router.push('/caregiver');
      else if (mockUser.role === 'family') router.push('/family');
      else if (mockUser.role === 'healthcare') router.push('/healthcare');
      else if (mockUser.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    } catch (error) {
      console.error('Simulated Login failed:', error);
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
